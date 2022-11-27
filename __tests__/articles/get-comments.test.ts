import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, profilesClient, usersClient} from '../utils';

describe('GET /api/articles/:slug/comments', () => {
  function makeGetCommentsUrl(slug: string) {
    return `/api/articles/${slug}/comments`;
  }

  describe('given a valid request', () => {
    describe('with authentication', () => {
      test('should return http status code 200 and the comments ordered by descending order of created time', async () => {
        const user = await usersClient.registerRandomUser();

        const articleAuthor = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article = await articlesClient.createRandomArticle(
          articleAuthor.user.token
        );

        const comment1 = await articlesClient.addRandomComment(
          author1.user.token,
          article.article.slug
        );

        const comment2 = await articlesClient.addRandomComment(
          author2.user.token,
          article.article.slug
        );

        const comment3 = await articlesClient.addRandomComment(
          author1.user.token,
          article.article.slug
        );

        await profilesClient.followUser(user.user.token, author1.user.username);

        const response = await request(app)
          .get(makeGetCommentsUrl(article.article.slug))
          .set('authorization', `Token ${user.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          comments: [
            {
              id: comment3.comment.id,
              createdAt: comment3.comment.createdAt,
              updatedAt: comment3.comment.updatedAt,
              body: comment3.comment.body,
              author: {
                username: author1.user.username,
                bio: author1.user.bio,
                image: author1.user.image,
                following: true,
              },
            },
            {
              id: comment2.comment.id,
              createdAt: comment2.comment.createdAt,
              updatedAt: comment2.comment.updatedAt,
              body: comment2.comment.body,
              author: {
                username: author2.user.username,
                bio: author2.user.bio,
                image: author2.user.image,
                following: false,
              },
            },
            {
              id: comment1.comment.id,
              createdAt: comment1.comment.createdAt,
              updatedAt: comment1.comment.updatedAt,
              body: comment1.comment.body,
              author: {
                username: author1.user.username,
                bio: author1.user.bio,
                image: author1.user.image,
                following: true,
              },
            },
          ],
        });
      });
    });
  });

  test('given article does not exist should return http status code 404 and an errors object', async () => {
    const user = await usersClient.registerRandomUser();

    const slug = slugify(faker.lorem.sentence());

    const response = await request(app)
      .get(makeGetCommentsUrl(slug))
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
        .get(makeGetCommentsUrl(article.article.slug))
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
        .get(makeGetCommentsUrl(article.article.slug))
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

      const requestBody = {
        comment: {
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .get(makeGetCommentsUrl(article.article.slug))
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
