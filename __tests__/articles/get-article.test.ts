import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient, profilesClient} from '../utils';

describe('GET /articles/:slug', () => {
  function makeGetArticleUrl(slug: string) {
    return `/articles/${slug}`;
  }

  describe('given a valid request', () => {
    describe('no authentication', () => {
      test('should return http status code 200 and the article', async () => {
        const author = await usersClient.registerRandomUser();

        const article = await articlesClient.createRandomArticle(
          author.user.token
        );

        const getArticleResponse = await request(app)
          .get(makeGetArticleUrl(article.article.slug))
          .send();

        expect(getArticleResponse.status).toBe(200);
        expect(getArticleResponse.body).toStrictEqual({
          article: {
            ...article.article,
            favorited: false,
          },
        });
      });
    });

    describe('with authentication', () => {
      describe('given author is followed', () => {
        describe('given article has been favorited', () => {
          test('should return http status code 200 and the article', async () => {
            const user1 = await usersClient.registerRandomUser();

            const user2 = await usersClient.registerRandomUser();

            const author = await usersClient.registerRandomUser();

            const article = await articlesClient.createRandomArticle(
              author.user.token
            );

            await profilesClient.followUser(
              user1.user.token,
              author.user.username
            );

            await articlesClient.favoriteArticle(
              user2.user.token,
              article.article.slug
            );

            const getArticleResponse = await request(app)
              .get(makeGetArticleUrl(article.article.slug))
              .set('authorization', `Token ${user1.user.token}`)
              .send();

            expect(getArticleResponse.status).toBe(200);
            expect(getArticleResponse.body).toStrictEqual({
              article: {
                ...article.article,
                favoritesCount: 1,
                author: {
                  ...article.article.author,
                  following: true,
                },
              },
            });
          });
        });

        describe('given article has not been favorited', () => {
          test('should return http status code 200 and the article', async () => {
            const user1 = await usersClient.registerRandomUser();

            const author = await usersClient.registerRandomUser();

            const article = await articlesClient.createRandomArticle(
              author.user.token
            );

            await profilesClient.followUser(
              user1.user.token,
              author.user.username
            );

            const getArticleResponse = await request(app)
              .get(makeGetArticleUrl(article.article.slug))
              .set('authorization', `Token ${user1.user.token}`)
              .send();

            expect(getArticleResponse.status).toBe(200);
            expect(getArticleResponse.body).toStrictEqual({
              article: {
                ...article.article,
                favoritesCount: 0,
                author: {
                  ...article.article.author,
                  following: true,
                },
              },
            });
          });
        });
      });

      describe('given author is not followed', () => {
        describe('given article has been favorited', () => {
          test('should return http status code 200 and the article', async () => {
            const user1 = await usersClient.registerRandomUser();

            const user2 = await usersClient.registerRandomUser();

            const author = await usersClient.registerRandomUser();

            const article = await articlesClient.createRandomArticle(
              author.user.token
            );

            await articlesClient.favoriteArticle(
              user2.user.token,
              article.article.slug
            );

            const getArticleResponse = await request(app)
              .get(makeGetArticleUrl(article.article.slug))
              .set('authorization', `Token ${user1.user.token}`)
              .send();

            expect(getArticleResponse.status).toBe(200);
            expect(getArticleResponse.body).toStrictEqual({
              article: {
                ...article.article,
                favoritesCount: 1,
                author: {
                  ...article.article.author,
                  following: false,
                },
              },
            });
          });
        });

        describe('given article has not been favorited', () => {
          test('should return http status code 200 and the article', async () => {
            const user1 = await usersClient.registerRandomUser();

            const author = await usersClient.registerRandomUser();

            const article = await articlesClient.createRandomArticle(
              author.user.token
            );

            const getArticleResponse = await request(app)
              .get(makeGetArticleUrl(article.article.slug))
              .set('authorization', `Token ${user1.user.token}`)
              .send();

            expect(getArticleResponse.status).toBe(200);
            expect(getArticleResponse.body).toStrictEqual({
              article: {
                ...article.article,
                favoritesCount: 0,
                author: {
                  ...article.article.author,
                  following: false,
                },
              },
            });
          });
        });
      });
    });
  });

  test('given article does not exist should return http status code 404 and an errors object', async () => {
    const slug = slugify(faker.lorem.sentence());

    const getArticleResponse = await request(app)
      .get(makeGetArticleUrl(slug))
      .send();

    expect(getArticleResponse.status).toBe(404);
    expect(getArticleResponse.body).toStrictEqual({
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

      const getArticleResponse = await request(app)
        .get(makeGetArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(getArticleResponse.status).toBe(401);
      expect(getArticleResponse.body).toStrictEqual({
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

      const getArticleResponse = await request(app)
        .get(makeGetArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(getArticleResponse.status).toBe(401);
      expect(getArticleResponse.body).toStrictEqual({
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

      const getArticleResponse = await request(app)
        .get(makeGetArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send();

      expect(getArticleResponse.status).toBe(401);
      expect(getArticleResponse.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});
