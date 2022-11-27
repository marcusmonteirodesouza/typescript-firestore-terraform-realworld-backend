import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient} from '../utils';

describe('POST /api/articles/:slug/favorite', () => {
  function makeFavoriteArticleUrl(slug: string) {
    return `/api/articles/${slug}/favorite`;
  }

  describe('given a valid request', () => {
    test('should return http status code 200 and the article', async () => {
      const user1 = await usersClient.registerRandomUser();

      const user2 = await usersClient.registerRandomUser();

      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const favoriteArticleResponse1 = await request(app)
        .post(makeFavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${user1.user.token}`)
        .send();

      expect(favoriteArticleResponse1.status).toBe(200);
      expect(favoriteArticleResponse1.body).toStrictEqual({
        article: {
          ...article.article,
          favoritesCount: 1,
          favorited: true,
          updatedAt: expect.toBeAfter(article.article.updatedAt),
        },
      });

      const favoriteArticleResponse2 = await request(app)
        .post(makeFavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${user2.user.token}`)
        .send();

      expect(favoriteArticleResponse2.status).toBe(200);
      expect(favoriteArticleResponse2.body).toStrictEqual({
        article: {
          ...favoriteArticleResponse1.body.article,
          favoritesCount: 2,
          updatedAt: expect.toBeAfter(article.article.updatedAt),
        },
      });
    });
  });

  test('given article does not exist should return http status code 404 and an errors object', async () => {
    const user = await usersClient.registerRandomUser();

    const slug = slugify(faker.lorem.sentence());

    const response = await request(app)
      .post(makeFavoriteArticleUrl(slug))
      .set('authorization', `Token ${user.user.token}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({
      errors: {
        body: [`slug "${slug}" not found`],
      },
    });
  });

  describe('authentication errors', () => {
    test('given no authentication should return http status code 401 and an errors object', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const response = await request(app)
        .post(makeFavoriteArticleUrl(article.article.slug))
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given user is not found should return http status code 401 and an errors object', async () => {
      const token = jwt.getRandomToken();

      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const response = await request(app)
        .post(makeFavoriteArticleUrl(article.article.slug))
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

      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const response = await request(app)
        .post(makeFavoriteArticleUrl(article.article.slug))
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
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const expiresInSeconds = 1;

      const token = jwt.getRandomToken({
        subject: author.user.id,
        expiresInSeconds,
      });

      await new Promise(r => setTimeout(r, expiresInSeconds * 1000 + 1));

      const response = await request(app)
        .post(makeFavoriteArticleUrl(article.article.slug))
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
