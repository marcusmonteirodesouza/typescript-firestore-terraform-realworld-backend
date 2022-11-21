import {FieldValue, Firestore} from '@google-cloud/firestore';
import slugify from 'slugify';
import {AlreadyExistsError, NotFoundError} from '../errors';
import {UsersService} from '../users';
import {Article} from './article';

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

class ArticlesService {
  private articlesCollection = 'articles';
  private favoritesCollection = 'favorites';

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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await articlesCollection.add(articleData);

    return (await this.getArticleBySlug(slug))!;
  }

  async getArticleById(articleId: string): Promise<Article | undefined> {
    const articleDoc = await this.firestore
      .doc(`${this.articlesCollection}/${articleId}`)
      .get();

    if (!articleDoc.exists) {
      return;
    }

    const articleData = articleDoc.data()!;

    const favoritesCount = await this.getFavoritesCount(articleDoc.id);

    return new Article(
      articleDoc.id,
      articleData.authorId,
      articleData.slug,
      articleData.title,
      articleData.description,
      articleData.body,
      articleData.tagList,
      articleData.createdAt.toDate(),
      articleData.updatedAt.toDate(),
      favoritesCount
    );
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const snapshot = await this.firestore
      .collection(this.articlesCollection)
      .where('slug', '==', slug)
      .get();

    if (snapshot.empty) {
      return undefined;
    }

    const articleDoc = snapshot.docs[0];

    return await this.getArticleById(articleDoc.id);
  }

  async updateArticle(
    articleId: string,
    params: UpdateArticleParams
  ): Promise<Article> {
    await this.firestore.runTransaction(async t => {
      const articleDocRef = this.firestore.doc(
        `${this.articlesCollection}/${articleId}`
      );

      const articleDoc = await t.get(articleDocRef);

      if (!articleDoc.exists) {
        throw new NotFoundError(`article "${articleId}" not found`);
      }

      const articleData = articleDoc.data()!;

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

      t.update(articleDocRef, {
        ...articleData,
        updatedAt: FieldValue.serverTimestamp(),
      });
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
    const snapshot = await this.firestore
      .collection(this.articlesCollection)
      .select('tagList')
      .get();

    const tags = [
      ...new Set(snapshot.docs.map(doc => doc.get('tagList')).flat()),
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
      .where('articleId', '==', article.id)
      .where('userId', '==', user.id)
      .get();

    if (snapshot.empty) {
      return false;
    }

    return true;
  }

  private prepareSlug(title: string): string {
    return slugify(title.toLowerCase());
  }

  private prepareTagList(tagList: string[]) {
    tagList = [...new Set(tagList.map(tag => slugify(tag.toLowerCase())))];
    tagList.sort();
    return tagList;
  }

  private async getFavoritesCount(articleId: string): Promise<number> {
    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .where('articleId', '==', articleId)
      .get();

    return snapshot.docs.length;
  }
}

export {ArticlesService};
