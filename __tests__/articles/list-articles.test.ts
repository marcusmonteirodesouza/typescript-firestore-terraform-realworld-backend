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

describe('GET /api/articles/:slug', () => {
  const listArticlesUrl = '/api/articles';

  beforeEach(async () => {
    await clearFirestore();
  });

  describe('given a valid request', () => {
    describe('with authentication', () => {
      test('given no filters should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        const article3 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(listArticlesUrl)
          .set('authorization', `Token ${user.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            article3.article,
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
            },
          ],
          articlesCount: 3,
        });
      });

      test('given tag filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const tag = 'mytag';

        await articlesClient.updateArticle(
          author1.user.token,
          article1.article.slug,
          {tagList: [...article1.article.tagList, tag]}
        );

        await articlesClient.updateArticle(
          author2.user.token,
          article2.article.slug,
          {tagList: [...article2.article.tagList, tag]}
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?tag=${tag}`)
          .set('authorization', `Token ${user.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            {
              ...article2.article,
              tagList: [...article2.article.tagList, tag].sort(),
              updatedAt: expect.toBeAfter(article2.article.updatedAt),
              author: {
                ...article2.article.author,
                following: true,
              },
            },
            {
              ...article1.article,
              tagList: [...article1.article.tagList, tag].sort(),
              favoritesCount: 1,
              updatedAt: expect.toBeAfter(article1.article.updatedAt),
              favorited: true,
            },
          ],
          articlesCount: 2,
        });
      });

      test('given author filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?author=${author2.user.username}`)
          .set('authorization', `Token ${user.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            {
              ...article2.article,
              author: {
                ...article2.article.author,
                following: true,
              },
            },
          ],
          articlesCount: 1,
        });
      });

      test('given favorited filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await articlesClient.createRandomArticle(author2.user.token);

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?favorited=${user.user.username}`)
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
            },
          ],
          articlesCount: 1,
        });
      });

      test('given limit filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        const article3 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?limit=2`)
          .set('authorization', `Token ${user.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            article3.article,
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
        }

        const response = await request(app)
          .get(listArticlesUrl)
          .set('authorization', `Token ${user.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: articles
            .reverse()
            .map(article => article.article)
            .slice(0, defaultLimit),
          articlesCount: defaultLimit,
        });
      });

      test('given offset filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await articlesClient.createRandomArticle(author2.user.token);

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?offset=2`)
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
            },
          ],
          articlesCount: 1,
        });
      });
    });

    describe('without authentication', () => {
      test('given not filters should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        const article3 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app).get(listArticlesUrl).send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            article3.article,
            {
              ...article2.article,
              author: {
                ...article2.article.author,
                following: false,
              },
            },
            {
              ...article1.article,
              favoritesCount: 1,
              updatedAt: expect.toBeAfter(article1.article.updatedAt),
              favorited: false,
            },
          ],
          articlesCount: 3,
        });
      });

      test('given tag filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const tag = 'mytag';

        await articlesClient.updateArticle(
          author1.user.token,
          article1.article.slug,
          {tagList: [...article1.article.tagList, tag]}
        );

        await articlesClient.updateArticle(
          author2.user.token,
          article2.article.slug,
          {tagList: [...article2.article.tagList, tag]}
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?tag=${tag}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            {
              ...article2.article,
              tagList: [...article2.article.tagList, tag].sort(),
              updatedAt: expect.toBeAfter(article2.article.updatedAt),
              author: {
                ...article2.article.author,
                following: false,
              },
            },
            {
              ...article1.article,
              tagList: [...article1.article.tagList, tag].sort(),
              favoritesCount: 1,
              updatedAt: expect.toBeAfter(article1.article.updatedAt),
              favorited: false,
            },
          ],
          articlesCount: 2,
        });
      });

      test('given author filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?author=${author2.user.username}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            {
              ...article2.article,
              author: {
                ...article2.article.author,
                following: false,
              },
            },
          ],
          articlesCount: 1,
        });
      });

      test('given favorited filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await articlesClient.createRandomArticle(author2.user.token);

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?favorited=${user.user.username}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            {
              ...article1.article,
              favoritesCount: 1,
              updatedAt: expect.toBeAfter(article1.article.updatedAt),
              favorited: false,
            },
          ],
          articlesCount: 1,
        });
      });

      test('given limit filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        const article2 = await articlesClient.createRandomArticle(
          author2.user.token
        );

        const article3 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?limit=2`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            article3.article,
            {
              ...article2.article,
              author: {
                ...article2.article.author,
                following: false,
              },
            },
          ],
          articlesCount: 2,
        });
      });

      test('given no limit filter should return at most 20 articles', async () => {
        const defaultLimit = 20;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const articles: any[] = [];

        for (let i = 0; i < defaultLimit + 1; i++) {
          const author = await usersClient.registerRandomUser();
          const article = await articlesClient.createRandomArticle(
            author.user.token
          );
          articles.push(article);
        }

        const response = await request(app).get(listArticlesUrl).send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: articles
            .reverse()
            .map(article => article.article)
            .slice(0, defaultLimit),
          articlesCount: defaultLimit,
        });
      });

      test('given offset filter should return http status code 200 and multiple articles, ordered by descending order of creation time', async () => {
        const user = await usersClient.registerRandomUser();

        const author1 = await usersClient.registerRandomUser();

        const author2 = await usersClient.registerRandomUser();

        const article1 = await articlesClient.createRandomArticle(
          author1.user.token
        );

        await articlesClient.createRandomArticle(author2.user.token);

        await articlesClient.createRandomArticle(author1.user.token);

        await profilesClient.followUser(user.user.token, author2.user.username);

        await articlesClient.favoriteArticle(
          user.user.token,
          article1.article.slug
        );

        const response = await request(app)
          .get(`${listArticlesUrl}?offset=2`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          articles: [
            {
              ...article1.article,
              favoritesCount: 1,
              updatedAt: expect.toBeAfter(article1.article.updatedAt),
              favorited: false,
            },
          ],
          articlesCount: 1,
        });
      });
    });
  });

  describe('authentication errors', () => {
    test('given user is not found should return http status code 401 and an errors object', async () => {
      const token = jwt.getRandomToken();

      const response = await request(app)
        .get(listArticlesUrl)
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
        .get(listArticlesUrl)
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
        .get(listArticlesUrl)
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
