import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient} from '../utils';

describe('PUT /articles/:slug', () => {
  function makeUpdateArticleUrl(slug: string) {
    return `/articles/${slug}`;
  }

  describe('given a valid request', () => {
    test('given all fields are set should return http status code 200 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const randomSuffix = faker.random.alphaNumeric(8);

      const updateArticleRequestBody = {
        article: {
          title: ` A New Hope ${randomSuffix} `,
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: [' bTag ', ' bTag1 ', ' a tag ', ' bTag '],
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(200);
      expect(updateArticleResponse.body).toStrictEqual({
        article: {
          ...article.article,
          slug: `a-new-hope-${randomSuffix}`,
          title: updateArticleRequestBody.article.title,
          description: updateArticleRequestBody.article.description,
          body: updateArticleRequestBody.article.body,
          tagList: ['a-tag', 'btag', 'btag1'],
          updatedAt: expect.toBeDateString(),
        },
      });
      expect(updateArticleResponse.body.article.updatedAt).toBeAfter(
        article.article.updatedAt
      );
    });

    test('given title should return http status code 200 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const randomSuffix = faker.random.alphaNumeric(8);

      const updateArticleRequestBody = {
        article: {
          title: ` A New Hope ${randomSuffix} `,
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(200);
      expect(updateArticleResponse.body).toStrictEqual({
        article: {
          ...article.article,
          slug: `a-new-hope-${randomSuffix}`,
          title: updateArticleRequestBody.article.title,
          updatedAt: expect.toBeDateString(),
        },
      });
      expect(updateArticleResponse.body.article.updatedAt).toBeAfter(
        article.article.updatedAt
      );
    });

    test('given title that results in the same slug for the same article should return http status code 200 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const updateArticleRequestBody = {
        article: {
          title: article.article.title,
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(200);
      expect(updateArticleResponse.body).toStrictEqual({
        article: {
          ...article.article,
          updatedAt: expect.toBeDateString(),
        },
      });
      expect(updateArticleResponse.body.article.updatedAt).toStrictEqual(
        article.article.updatedAt
      );
    });

    test('given description should return http status code 200 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const updateArticleRequestBody = {
        article: {
          description: faker.lorem.sentences(),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(200);
      expect(updateArticleResponse.body).toStrictEqual({
        article: {
          ...article.article,
          description: updateArticleRequestBody.article.description,
          updatedAt: expect.toBeDateString(),
        },
      });
      expect(updateArticleResponse.body.article.updatedAt).toBeAfter(
        article.article.updatedAt
      );
    });

    test('given body should return http status code 200 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const updateArticleRequestBody = {
        article: {
          body: faker.lorem.paragraphs(),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(200);
      expect(updateArticleResponse.body).toStrictEqual({
        article: {
          ...article.article,
          body: updateArticleRequestBody.article.body,
          updatedAt: expect.toBeDateString(),
        },
      });
      expect(updateArticleResponse.body.article.updatedAt).toBeAfter(
        article.article.updatedAt
      );
    });

    test('given tagList should return http status code 200 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const updateArticleRequestBody = {
        article: {
          tagList: [' bTag ', ' bTag1 ', ' a tag ', ' bTag '],
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(200);
      expect(updateArticleResponse.body).toStrictEqual({
        article: {
          ...article.article,
          tagList: ['a-tag', 'btag', 'btag1'],
          updatedAt: expect.toBeDateString(),
        },
      });
      expect(updateArticleResponse.body.article.updatedAt).toBeAfter(
        article.article.updatedAt
      );
    });
  });

  test('given article does not exist should return http status code 404 and an errors object', async () => {
    const user = await usersClient.registerRandomUser();

    const slug = slugify(faker.lorem.sentence());

    const updateArticleRequestBody = {
      article: {
        title: faker.lorem.sentence(),
        description: faker.lorem.sentences(),
        body: faker.lorem.paragraphs(),
        tagList: faker.lorem.words().split(' '),
      },
    };

    const updateArticleResponse = await request(app)
      .put(makeUpdateArticleUrl(slug))
      .set('authorization', `Token ${user.user.token}`)
      .send(updateArticleRequestBody);

    expect(updateArticleResponse.status).toBe(404);
    expect(updateArticleResponse.body).toStrictEqual({
      errors: {
        body: [`slug "${slug}" not found`],
      },
    });
  });

  describe('title validation', () => {
    test('given title results in taken slug should return http status code 422 and an errors object', async () => {
      const author = await usersClient.registerRandomUser();

      const existingAuthor = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const existingArticle = await articlesClient.createRandomArticle(
        existingAuthor.user.token
      );

      const updateArticleRequestBody = {
        article: {
          title: existingArticle.article.title,
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${author.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(422);
      expect(updateArticleResponse.body).toStrictEqual({
        errors: {
          body: ['"slug" is taken'],
        },
      });
    });
  });

  describe('authentication errors', () => {
    test('given no authentication should return http status code 401 and an errors object', async () => {
      const author = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        author.user.token
      );

      const updateArticleRequestBody = {
        article: {
          title: faker.lorem.sentence(),
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(401);
      expect(updateArticleResponse.body).toStrictEqual({
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

      const updateArticleRequestBody = {
        article: {
          title: faker.lorem.sentence(),
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(401);
      expect(updateArticleResponse.body).toStrictEqual({
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

      const updateArticleRequestBody = {
        article: {
          title: faker.lorem.sentence(),
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${user.user.token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(401);
      expect(updateArticleResponse.body).toStrictEqual({
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

      const updateArticleRequestBody = {
        article: {
          title: faker.lorem.sentence(),
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(401);
      expect(updateArticleResponse.body).toStrictEqual({
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

      const updateArticleRequestBody = {
        article: {
          title: faker.lorem.sentence(),
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const updateArticleResponse = await request(app)
        .put(makeUpdateArticleUrl(article.article.slug))
        .set('authorization', `Token ${token}`)
        .send(updateArticleRequestBody);

      expect(updateArticleResponse.status).toBe(401);
      expect(updateArticleResponse.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});
