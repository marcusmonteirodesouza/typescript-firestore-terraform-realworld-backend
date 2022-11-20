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

  async favoriteArticleBySlug(slug: string, userId: string) {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new NotFoundError(`slug "${slug}" not found`);
    }

    if (!(await this.usersService.getUserById(userId))) {
      throw new NotFoundError(`user "${userId}" not found`);
    }

    await this.firestore.collection(this.favoritesCollection).add({
      articleId: article.id,
      userId,
    });

    return new Article(
      article.id,
      article.authorId,
      article.slug,
      article.title,
      article.description,
      article.body,
      article.tagList,
      article.createdAt,
      article.updatedAt,
      article.favoritesCount + 1
    );
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

  private async getFavoritesCount(articleId: string) {
    const snapshot = await this.firestore
      .collection(this.favoritesCollection)
      .where('articleId', '==', articleId)
      .get();

    return snapshot.docs.length;
  }
}

export {ArticlesService};
