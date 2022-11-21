import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient} from '../utils';

describe('DELETE /articles/:slug', () => {
  function makeDeleteArticleUrl(slug: string) {
    return `/articles/${slug}`;
  }

  describe('given a valid request', () => {
    test('should return http status code 204', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const deleteArticleResponse = await request(app)
        .delete(makeDeleteArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send();

      expect(deleteArticleResponse.status).toBe(204);
      expect(deleteArticleResponse.body).toBeEmpty();

      const getArticleResponse = await request(app)
        .get(makeDeleteArticleUrl(article.article.slug))
        .send();

      expect(getArticleResponse.status).toBe(404);
    });

    test('given article does not exist should return http status code 404 and an errors object', async () => {
      const user = await usersClient.registerRandomUser();

      const slug = slugify(faker.lorem.sentence());

      const deleteArticleResponse = await request(app)
        .delete(makeDeleteArticleUrl(slug))
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(deleteArticleResponse.status).toBe(404);
      expect(deleteArticleResponse.body).toStrictEqual({
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

        const deleteArticleResponse = await request(app)
          .delete(makeDeleteArticleUrl(article.article.slug))
          .send();

        expect(deleteArticleResponse.status).toBe(401);
        expect(deleteArticleResponse.body).toStrictEqual({
          errors: {
            body: ['unauthorized'],
          },
        });
      });
    });

    test('given user is not found should return http status code 401 and an errors object', async () => {
      const token = jwt.getRandomToken();

      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const deleteArticleResponse = await request(app)
        .delete(makeDeleteArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(deleteArticleResponse.status).toBe(401);
      expect(deleteArticleResponse.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test("given user is not the article's author should return http status code 401 and an errors object", async () => {
      const author = await usersClient.registerRandomUser();
      const user = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const deleteArticleResponse = await request(app)
        .delete(makeDeleteArticleUrl(article.article.slug))
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(deleteArticleResponse.status).toBe(401);
      expect(deleteArticleResponse.body).toStrictEqual({
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

      const deleteArticleResponse = await request(app)
        .delete(makeDeleteArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(deleteArticleResponse.status).toBe(401);
      expect(deleteArticleResponse.body).toStrictEqual({
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

      const deleteArticleResponse = await request(app)
        .delete(makeDeleteArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(deleteArticleResponse.status).toBe(401);
      expect(deleteArticleResponse.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});
