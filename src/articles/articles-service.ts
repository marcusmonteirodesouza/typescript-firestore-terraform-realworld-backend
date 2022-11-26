import {
  FieldValue,
  Firestore,
  FirestoreDataConverter,
} from '@google-cloud/firestore';
import slugify from 'slugify';
import {AlreadyExistsError, NotFoundError} from '../errors';
import {UsersService} from '../users';
import {Article} from './article';
import {Comment} from './comment';

interface CreateArticleParams {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

interface UpdateArticleParams {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
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
      data.tagList,
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
  private articlesCollection = 'articles';
  private favoritesCollection = 'favorites';
  private commentsCollection = 'comments';

  constructor(
    private firestore: Firestore,
    private usersService: UsersService
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

    let tagList: string[] = [];

    if (params.tagList) {
      tagList = this.prepareTagList(params.tagList);
    }

    const articleData = {
      authorId,
      slug,
      title: params.title.trim(),
      description: params.description,
      body: params.body,
      tagList,
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

      if (params.tagList) {
        articleData.tagList = this.prepareTagList(params.tagList);
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
      .select('tagList')
      .get();

    const tags = [
      ...new Set(listTagsSnapshot.docs.map(doc => doc.get('tagList')).flat()),
    ] as string[];
    tags.sort();
    return tags;
  }

  async favoriteArticleBySlug(slug: string, userId: string): Promise<void> {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new NotFoundError(`slug "${slug}" not found`);
    }

    if (await this.isFavorited(article.id, userId)) {
      return;
    }

    await this.firestore.collection(this.favoritesCollection).add({
      articleId: article.id,
      userId,
    });
  }

  async getFavoritesCount(articleId: string): Promise<number> {
    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .select()
      .where('articleId', '==', articleId)
      .get();

    return snapshot.docs.length;
  }

  async unfavoriteArticleBySlug(slug: string, userId: string): Promise<void> {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new NotFoundError(`slug "${slug}" not found`);
    }

    if (!(await this.isFavorited(article.id, userId))) {
      return;
    }

    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .select()
      .where('articleId', '==', article.id)
      .where('userId', '==', userId)
      .get();

    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  }

  async isFavorited(articleId: string, userId: string): Promise<boolean> {
    const article = await this.getArticleById(articleId);

    if (!article) {
      throw new NotFoundError(`article ${articleId} not found`);
    }

    const user = await this.usersService.getUserById(userId);

    if (!user) {
      throw new NotFoundError(`user "${userId}" not found`);
    }

    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .select()
      .where('articleId', '==', article.id)
      .where('userId', '==', user.id)
      .get();

    if (snapshot.empty) {
      return false;
    }

    return true;
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

  private prepareTagList(tagList: string[]) {
    tagList = [...new Set(tagList.map(tag => slugify(tag.toLowerCase())))];
    tagList.sort();
    return tagList;
  }
}

export {ArticlesService};
