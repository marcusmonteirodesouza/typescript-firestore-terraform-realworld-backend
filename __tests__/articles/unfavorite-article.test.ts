import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient} from '../utils';

describe('DELETE /articles/:slug/favorite', () => {
  function makeUnfavoriteArticleUrl(slug: string) {
    return `/articles/${slug}/favorite`;
  }

  describe('given a valid request', () => {
    test('should return http status code 200 and the article', async () => {
      const user1 = await usersClient.registerRandomUser();

      const user2 = await usersClient.registerRandomUser();

      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      await articlesClient.favoriteArticle(
        user1.user.token,
        article.article.slug
      );

      await articlesClient.favoriteArticle(
        user2.user.token,
        article.article.slug
      );

      const unfavoriteArticleResponse1 = await request(app)
        .delete(makeUnfavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${user1.user.token}`)
        .send();

      expect(unfavoriteArticleResponse1.status).toBe(200);
      expect(unfavoriteArticleResponse1.body).toStrictEqual({
        article: {
          ...article.article,
          favoritesCount: 1,
          favorited: false,
        },
      });

      const unfavoriteArticleResponse2 = await request(app)
        .delete(makeUnfavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${user2.user.token}`)
        .send();

      expect(unfavoriteArticleResponse2.status).toBe(200);
      expect(unfavoriteArticleResponse2.body).toStrictEqual({
        article: {
          ...unfavoriteArticleResponse1.body.article,
          favoritesCount: 0,
          favorited: false,
        },
      });
    });

    test('given article is not favorited should return http status code 200 and the article', async () => {
      const user = await usersClient.registerRandomUser();

      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const unfavoriteArticleResponse = await request(app)
        .delete(makeUnfavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(unfavoriteArticleResponse.status).toBe(200);
      expect(unfavoriteArticleResponse.body).toStrictEqual({
        article: {
          ...article.article,
          favoritesCount: 0,
          favorited: false,
        },
      });
    });
  });

  test('given article does not exist should return http status code 404 and an errors object', async () => {
    const user = await usersClient.registerRandomUser();

    const slug = slugify(faker.lorem.sentence());

    const unfavoriteArticleResponse = await request(app)
      .delete(makeUnfavoriteArticleUrl(slug))
      .set('authorization', `Token ${user.user.token}`)
      .send();

    expect(unfavoriteArticleResponse.status).toBe(404);
    expect(unfavoriteArticleResponse.body).toStrictEqual({
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

      const unfavoriteArticleResponse = await request(app)
        .delete(makeUnfavoriteArticleUrl(article.article.slug))
        .send();

      expect(unfavoriteArticleResponse.status).toBe(401);
      expect(unfavoriteArticleResponse.body).toStrictEqual({
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

      const unfavoriteArticleResponse = await request(app)
        .delete(makeUnfavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(unfavoriteArticleResponse.status).toBe(401);
      expect(unfavoriteArticleResponse.body).toStrictEqual({
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

      const unfavoriteArticleResponse = await request(app)
        .delete(makeUnfavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(unfavoriteArticleResponse.status).toBe(401);
      expect(unfavoriteArticleResponse.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given token is expired should return http status code 401 and an errors object', async () => {
      const expiresInSeconds = 1;

      const token = jwt.getRandomToken({expiresInSeconds});

      await new Promise(r => setTimeout(r, expiresInSeconds * 1000 + 1));

      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const unfavoriteArticleResponse = await request(app)
        .delete(makeUnfavoriteArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(unfavoriteArticleResponse.status).toBe(401);
      expect(unfavoriteArticleResponse.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});