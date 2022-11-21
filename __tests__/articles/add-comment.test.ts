import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient} from '../utils';

describe('POST /articles/:slug/comments', () => {
  function makeAddCommentUrl(slug: string) {
    return `/articles/${slug}/comments`;
  }

  describe('given a valid request', () => {
    test('should return http status code 201 and the comment', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const requestBody = {
        comment: {
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(makeAddCommentUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual({
        comment: {
          id: expect.not.toBeEmpty(),
          createdAt: expect.toBeDateString(),
          updatedAt: expect.toBeDateString(),
          body: requestBody.comment.body,
          author: {
            username: author.user.username,
            bio: author.user.bio,
            image: author.user.image,
            following: false,
          },
        },
      });
    });

    test('given article does not exist should return http status code 404 and an errors object', async () => {
      const user = await usersClient.registerRandomUser();

      const slug = slugify(faker.lorem.sentence());

      const requestBody = {
        comment: {
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(makeAddCommentUrl(slug))
        .set('authorization', `Token ${user.user.token}`)
        .send(requestBody);

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

        const requestBody = {
          comment: {
            body: faker.lorem.paragraphs(),
          },
        };

        const response = await request(app)
          .post(makeAddCommentUrl(article.article.slug))
          .send(requestBody);

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
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

      const requestBody = {
        comment: {
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(makeAddCommentUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send(requestBody);

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

      const requestBody = {
        comment: {
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(makeAddCommentUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
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

      const requestBody = {
        comment: {
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(makeAddCommentUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});
