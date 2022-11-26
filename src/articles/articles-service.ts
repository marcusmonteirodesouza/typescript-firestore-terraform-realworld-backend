import {
  FieldValue,
  Firestore,
  FirestoreDataConverter,
} from '@google-cloud/firestore';
import slugify from 'slugify';
import {Joi} from 'celebrate';
import {AlreadyExistsError, NotFoundError} from '../errors';
import {UsersService} from '../users';
import {Article} from './article';
import {Comment} from './comment';

interface CreateArticleParams {
  title: string;
  description: string;
  body: string;
  tags?: string[];
}

interface ListArticlesParams {
  orderBy: {
    field: 'createdAt';
    direction: 'asc' | 'desc';
  }[];
  tag?: string;
  authorId?: string;
  favoritedByUserId?: string;
  limit?: number;
  offset?: number;
}

interface UpdateArticleParams {
  title?: string;
  description?: string;
  body?: string;
  tags?: string[];
  favoritedBy?: string[];
}

interface ListCommentsParams {
  orderBy: {
    field: 'createdAt';
    direction: 'asc' | 'desc';
  }[];
  slug?: string;
}

const articleConverter: FirestoreDataConverter<Article> = {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  toFirestore: function (_article) {
    throw new Error('Function not implemented.');
  },

  fromFirestore: function (snapshot): Article {
    const data = snapshot.data();

    return new Article(
      snapshot.id,
      data.authorId,
      data.slug,
      data.title,
      data.description,
      data.body,
      data.tags,
      data.favoritedBy,
      snapshot.createTime!.toDate(),
      snapshot.updateTime!.toDate()
    );
  },
};

const commentConverter: FirestoreDataConverter<Comment> = {
  toFirestore: function (comment) {
    return {
      articleId: comment.articleId,
      authorId: comment.authorId,
      body: comment.body,
    };
  },

  fromFirestore: function (snapshot) {
    const data = snapshot.data();

    return new Comment(
      snapshot.id,
      data.articleId,
      data.authorId,
      data.body,
      snapshot.createTime!.toDate(),
      snapshot.updateTime!.toDate()
    );
  },
};

class ArticlesService {
  private readonly articlesCollection = 'articles';
  private readonly commentsCollection = 'comments';

  constructor(
    private readonly firestore: Firestore,
    private readonly usersService: UsersService
  ) {}

  async createArticle(
    authorId: string,
    params: CreateArticleParams
  ): Promise<Article> {
    if (!this.usersService.getUserById(authorId)) {
      throw new NotFoundError(`user "${authorId}" not found`);
    }

    const slug = this.prepareSlug(params.title);

    if (await this.getArticleBySlug(slug)) {
      throw new AlreadyExistsError('"slug" is taken');
    }

    const articlesCollection = this.firestore.collection(
      this.articlesCollection
    );

    let tags: string[] = [];

    if (params.tags) {
      tags = this.prepareTags(params.tags);
    }

    const articleData = {
      authorId,
      slug,
      title: params.title.trim(),
      description: params.description,
      body: params.body,
      tags,
      favoritedBy: [],
      createdAt: FieldValue.serverTimestamp(), // used for orderBy
    };

    const articleDocRef = await articlesCollection.add(articleData);

    return (await this.getArticleById(articleDocRef.id))!;
  }

  async getArticleById(articleId: string): Promise<Article | undefined> {
    const articleSnapshot = await this.firestore
      .doc(`${this.articlesCollection}/${articleId}`)
      .withConverter(articleConverter)
      .get();

    if (!articleSnapshot.exists) {
      return;
    }

    return articleSnapshot.data();
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const articleSnapshot = await this.firestore
      .collection(this.articlesCollection)
      .where('slug', '==', slug)
      .withConverter(articleConverter)
      .get();

    if (articleSnapshot.empty) {
      return undefined;
    }

    return articleSnapshot.docs[0].data();
  }

  async listArticles(params: ListArticlesParams) {
    if (params.orderBy.length === 0) {
      throw new RangeError('"params.orderBy" must have at least 1 element');
    }

    let query = this.firestore
      .collection(this.articlesCollection)
      .withConverter(articleConverter)
      .orderBy(params.orderBy[0].field, params.orderBy[0].direction);

    for (let i = 1; i < params.orderBy.length; i++) {
      query = query.orderBy(
        params.orderBy[i].field,
        params.orderBy[i].direction
      );
    }

    if (params.tag) {
      query = query.where('tags', 'array-contains', params.tag);
    }

    if (params.authorId) {
      const author = await this.usersService.getUserById(params.authorId);

      if (!author) {
        throw new NotFoundError(`author "${params.authorId}" not found`);
      }

      query = query.where('authorId', '==', author.id);
    }

    if (params.favoritedByUserId) {
      const user = await this.usersService.getUserById(
        params.favoritedByUserId
      );

      if (!user) {
        throw new NotFoundError(`user "${params.favoritedByUserId}" not found`);
      }

      query = query.where('favoritedBy', 'array-contains', user.id);
    }

    if (params.limit) {
      const validatedLimit = await Joi.number()
        .integer()
        .validateAsync(params.limit);

      query = query.limit(validatedLimit);
    }

    if (params.offset) {
      const validatedOffset = await Joi.number()
        .integer()
        .validateAsync(params.offset);

      query = query.offset(validatedOffset);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => doc.data());
  }

  async updateArticle(
    articleId: string,
    params: UpdateArticleParams
  ): Promise<Article> {
    await this.firestore.runTransaction(async t => {
      const articleDocRef = this.firestore.doc(
        `${this.articlesCollection}/${articleId}`
      );

      const articleSnapshot = await t.get(articleDocRef);

      if (!articleSnapshot.exists) {
        throw new NotFoundError(`article "${articleId}" not found`);
      }

      const articleData = articleSnapshot.data()!;

      if (params.title && params.title !== articleData.title) {
        const slug = this.prepareSlug(params.title);

        if (slug !== articleData.slug && (await this.getArticleBySlug(slug))) {
          throw new AlreadyExistsError('"slug" is taken');
        }

        articleData.slug = slug;
        articleData.title = params.title;
      }

      if (
        params.description &&
        params.description !== articleData.description
      ) {
        articleData.description = params.description;
      }

      if (params.body && params.body !== articleData.body) {
        articleData.body = params.body;
      }

      if (params.tags) {
        articleData.tags = this.prepareTags(params.tags);
      }

      if (params.favoritedBy) {
        articleData.favoritedBy = this.prepareFavoritedBy(params.favoritedBy);
      }

      t.update(articleDocRef, articleData);
    });

    return (await this.getArticleById(articleId))!;
  }

  async deleteArticleBySlug(slug: string): Promise<void> {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new NotFoundError(`slug "${slug}" not found`);
    }

    await this.firestore
      .doc(`${this.articlesCollection}/${article.id}`)
      .delete();
  }

  async listTags(): Promise<string[]> {
    const listTagsSnapshot = await this.firestore
      .collection(this.articlesCollection)
      .select('tags')
      .get();

    const tags = [
      ...new Set(listTagsSnapshot.docs.map(doc => doc.get('tags')).flat()),
    ] as string[];
    tags.sort();
    return tags;
  }

  async favoriteArticleBySlug(slug: string, userId: string): Promise<void> {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new NotFoundError(`slug "${slug}" not found`);
    }

    const user = await this.usersService.getUserById(userId);

    if (!user) {
      throw new NotFoundError(`user "${userId}" not found`);
    }

    if (article.favoritedBy.includes(user.id)) {
      return;
    }

    await this.updateArticle(article.id, {
      favoritedBy: [...article.favoritedBy, user.id],
    });
  }

  async unfavoriteArticleBySlug(slug: string, userId: string): Promise<void> {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new NotFoundError(`slug "${slug}" not found`);
    }

    const user = await this.usersService.getUserById(userId);

    if (!user) {
      throw new NotFoundError(`user "${userId}" not found`);
    }

    if (!article.favoritedBy.includes(user.id)) {
      return;
    }

    await this.updateArticle(article.id, {
      favoritedBy: article.favoritedBy.filter(uId => uId !== user.id),
    });
  }

  async addComment(
    articleId: string,
    authorId: string,
    body: string
  ): Promise<Comment> {
    if (!(await this.getArticleById(articleId))) {
      throw new NotFoundError(`article ${articleId} not found`);
    }

    if (!(await this.usersService.getUserById(authorId))) {
      throw new NotFoundError(`user "${authorId}" not found`);
    }

    const commentData = {
      articleId,
      authorId,
      body,
      createdAt: FieldValue.serverTimestamp(), // used for orderBy
    };

    const commentDocRef = await this.firestore
      .collection(this.commentsCollection)
      .add(commentData);

    return (await this.getCommentById(commentDocRef.id))!;
  }

  async addCommentBySlug(
    slug: string,
    authorId: string,
    body: string
  ): Promise<Comment> {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new NotFoundError(`slug "${slug}" not found`);
    }

    return await this.addComment(article.id, authorId, body);
  }

  async getCommentById(commentId: string): Promise<Comment | undefined> {
    const commentSnapshot = await this.firestore
      .doc(`${this.commentsCollection}/${commentId}`)
      .withConverter(commentConverter)
      .get();

    if (!commentSnapshot.exists) {
      return;
    }

    return commentSnapshot.data();
  }

  async listComments(params: ListCommentsParams): Promise<Comment[]> {
    if (params.orderBy.length === 0) {
      throw new RangeError('"params.orderBy" must have at least 1 element');
    }

    let query = this.firestore
      .collection(this.commentsCollection)
      .withConverter(commentConverter)
      .orderBy(params.orderBy[0].field, params.orderBy[0].direction);

    for (let i = 1; i < params.orderBy.length; i++) {
      query = query.orderBy(
        params.orderBy[i].field,
        params.orderBy[i].direction
      );
    }

    if (params.slug) {
      const article = await this.getArticleBySlug(params.slug);

      if (!article) {
        throw new NotFoundError(`slug "${params.slug}" not found`);
      }

      query = query.where('articleId', '==', article.id);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => doc.data());
  }

  async deleteCommentById(commentId: string) {
    const comment = await this.getCommentById(commentId);

    if (!comment) {
      throw new NotFoundError(`comment "${commentId}" not found`);
    }

    await this.firestore
      .doc(`${this.commentsCollection}/${comment.id}`)
      .delete();
  }

  private prepareSlug(title: string): string {
    return slugify(title.toLowerCase());
  }

  private prepareTags(tags: string[]) {
    tags = [...new Set(tags.map(tag => slugify(tag.toLowerCase())))];
    tags.sort();
    return tags;
  }

  private prepareFavoritedBy(favoritedBy: string[]) {
    favoritedBy = Array.from(new Set(favoritedBy));
    favoritedBy.sort();
    return favoritedBy;
  }
}

export {ArticlesService};
