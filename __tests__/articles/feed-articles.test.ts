import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {
  clearFirestore,
  articlesClient,
  jwt,
  usersClient,
  profilesClient,
} from '../utils';

describe('GET /articles/feed', () => {
  const feedArticlesUrl = '/articles/feed';

  beforeEach(async () => {
    await clearFirestore();
  });

  describe('given a valid request', () => {
    test('given no filters should return http status code 200 and multiple articles from the user followed authors, ordered by descending order of creation time', async () => {
      const user = await usersClient.registerRandomUser();

      const author1 = await usersClient.registerRandomUser();

      const author2 = await usersClient.registerRandomUser();

      const author3 = await usersClient.registerRandomUser();

      const article1 = await articlesClient.createRandomArticle(
        author1.user.token
      );

      const article2 = await articlesClient.createRandomArticle(
        author2.user.token
      );

      const article3 = await articlesClient.createRandomArticle(
        author1.user.token
      );

      await articlesClient.createRandomArticle(author3.user.token);

      await profilesClient.followUser(user.user.token, author1.user.username);

      await profilesClient.followUser(user.user.token, author2.user.username);

      await articlesClient.favoriteArticle(
        user.user.token,
        article1.article.slug
      );

      const response = await request(app)
        .get(feedArticlesUrl)
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        articles: [
          {
            ...article3.article,
            author: {
              ...article3.article.author,
              following: true,
            },
          },
          {
            ...article2.article,
            author: {
              ...article2.article.author,
              following: true,
            },
          },
          {
            ...article1.article,
            favoritesCount: 1,
            updatedAt: expect.toBeAfter(article1.article.updatedAt),
            favorited: true,
            author: {
              ...article1.article.author,
              following: true,
            },
          },
        ],
        articlesCount: 3,
      });
    });

    test('given limit filter should return http status code 200 and multiple articles from the user followed authors, ordered by descending order of creation time', async () => {
      const user = await usersClient.registerRandomUser();

      const author1 = await usersClient.registerRandomUser();

      const author2 = await usersClient.registerRandomUser();

      const author3 = await usersClient.registerRandomUser();

      const article1 = await articlesClient.createRandomArticle(
        author1.user.token
      );

      const article2 = await articlesClient.createRandomArticle(
        author2.user.token
      );

      const article3 = await articlesClient.createRandomArticle(
        author1.user.token
      );

      await articlesClient.createRandomArticle(author3.user.token);

      await profilesClient.followUser(user.user.token, author1.user.username);

      await profilesClient.followUser(user.user.token, author2.user.username);

      await articlesClient.favoriteArticle(
        user.user.token,
        article1.article.slug
      );

      const response = await request(app)
        .get(`${feedArticlesUrl}?limit=2`)
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        articles: [
          {
            ...article3.article,
            author: {
              ...article3.article.author,
              following: true,
            },
          },
          {
            ...article2.article,
            author: {
              ...article2.article.author,
              following: true,
            },
          },
        ],
        articlesCount: 2,
      });
    });

    test('given no limit filter should return at most 20 articles', async () => {
      const defaultLimit = 20;

      const user = await usersClient.registerRandomUser();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articles: any[] = [];

      for (let i = 0; i < defaultLimit + 1; i++) {
        const author = await usersClient.registerRandomUser();
        const article = await articlesClient.createRandomArticle(
          author.user.token
        );
        articles.push(article);
        await profilesClient.followUser(user.user.token, author.user.username);
      }

      const response = await request(app)
        .get(feedArticlesUrl)
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        articles: articles
          .reverse()
          .map(article => {
            return {
              ...article.article,
              author: {
                ...article.article.author,
                following: true,
              },
            };
          })
          .slice(0, defaultLimit),
        articlesCount: defaultLimit,
      });
    });

    test('given offset filter should return http status code 200 and multiple articles from the user followed authors, ordered by descending order of creation time', async () => {
      const user = await usersClient.registerRandomUser();

      const author1 = await usersClient.registerRandomUser();

      const author2 = await usersClient.registerRandomUser();

      const author3 = await usersClient.registerRandomUser();

      const article1 = await articlesClient.createRandomArticle(
        author1.user.token
      );

      await articlesClient.createRandomArticle(author2.user.token);

      await articlesClient.createRandomArticle(author1.user.token);

      await articlesClient.createRandomArticle(author3.user.token);

      await profilesClient.followUser(user.user.token, author1.user.username);

      await profilesClient.followUser(user.user.token, author2.user.username);

      await articlesClient.favoriteArticle(
        user.user.token,
        article1.article.slug
      );

      const response = await request(app)
        .get(`${feedArticlesUrl}?offset=2`)
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        articles: [
          {
            ...article1.article,
            favoritesCount: 1,
            updatedAt: expect.toBeAfter(article1.article.updatedAt),
            favorited: true,
            author: {
              ...article1.article.author,
              following: true,
            },
          },
        ],
        articlesCount: 1,
      });
    });
  });

  describe('authentication errors', () => {
    test('given no authentication should return http status code 401 and an errors object', async () => {
      const response = await request(app).get(feedArticlesUrl).send();

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given user is not found should return http status code 401 and an errors object', async () => {
      const token = jwt.getRandomToken();

      const response = await request(app)
        .get(feedArticlesUrl)
        .set('authorization', `Token ${token}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given token has wrong issuer should return http status code 401 and an errors object', async () => {
      const issuer = faker.internet.url();

      const token = jwt.getRandomToken({issuer});

      const response = await request(app)
        .get(feedArticlesUrl)
        .set('authorization', `Token ${token}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given token is expired should return http status code 401 and an errors object', async () => {
      const user = await usersClient.registerRandomUser();

      const expiresInSeconds = 1;

      const token = jwt.getRandomToken({
        subject: user.user.id,
        expiresInSeconds,
      });

      await new Promise(r => setTimeout(r, expiresInSeconds * 1000 + 1));

      const response = await request(app)
        .get(feedArticlesUrl)
        .set('authorization', `Token ${token}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});
