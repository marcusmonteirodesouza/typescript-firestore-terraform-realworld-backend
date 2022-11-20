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

  async getArticleById(articleId: string) {
    const articleDoc = await this.firestore
      .doc(`${this.articlesCollection}/${articleId}`)
      .get();

    if (!articleDoc.exists) {
      return undefined;
    }

    const articleData = articleDoc.data()!;

    const favoritesCount = await this.getFavoritesCount(articleDoc.id);

    const user = new Article(
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

    return user;
  }

  async getArticleBySlug(slug: string) {
    const snapshot = await this.firestore
      .collection(this.articlesCollection)
      .where('slug', '==', slug)
      .get();

    if (snapshot.empty) {
      return undefined;
    }

    const articleDoc = snapshot.docs[0];
    const articleData = articleDoc.data();

    const favoritesCount = await this.getFavoritesCount(articleDoc.id);

    const user = new Article(
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

    return user;
  }

  async favoriteArticle(articleId: string, userId: string) {
    if (!(await this.getArticleById(articleId))) {
      throw new NotFoundError(`article "${articleId}" not found`);
    }

    if (!(await this.usersService.getUserById(userId))) {
      throw new NotFoundError(`user "${userId}" not found`);
    }

    await this.firestore.collection(this.articlesCollection).add({
      articleId,
      userId,
    });
  }

  async isFavorited(articleId: string, userId: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .where('articleId', '==', articleId)
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      return false;
    }

    return true;
  }

  async getFavoritesCount(articleId: string) {
    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .where('articleId', '==', articleId)
      .get();

    return snapshot.docs.length;
  }
}

export {ArticlesService};
