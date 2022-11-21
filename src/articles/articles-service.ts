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

class ArticlesService {
  private articlesCollection = 'articles';
  private tagsCollection = 'tags';
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

    const slug = slugify(params.title);

    if (await this.getArticleBySlug(slug)) {
      throw new AlreadyExistsError('"slug" is taken');
    }

    const batch = this.firestore.batch();

    const articlesCollection = this.firestore.collection(
      this.articlesCollection
    );

    const tagsCollection = this.firestore.collection(this.tagsCollection);

    let tagList: string[] = [];

    if (params.tagList) {
      tagList = [...new Set(params.tagList.map(tag => slugify(tag)))];
      tagList.sort();
    }

    for (const tag of tagList) {
      const tagDocRef = tagsCollection.doc(tag);
      batch.set(tagDocRef, {});
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

    const articleDocRef = articlesCollection.doc();

    batch.set(articleDocRef, articleData);

    await batch.commit();

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

    const article = new Article(
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

    return article;
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

  async listTags(): Promise<string[]> {
    const snapshot = await this.firestore.collection(this.tagsCollection).get();
    return snapshot.docs.map(doc => doc.id);
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

  private async getFavoritesCount(articleId: string): Promise<number> {
    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .where('articleId', '==', articleId)
      .get();

    return snapshot.docs.length;
  }
}

export {ArticlesService};
