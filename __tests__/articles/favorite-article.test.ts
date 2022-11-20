import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient} from '../utils';

describe('POST /articles/:slug/favorite', () => {
  function makeFavoriteArticleUrl(slug: string) {
    return `/articles/${slug}/favorite`;
  }

  test('given a valid request should return http status code 200 and the article', async () => {
    const user = await usersClient.registerRandomUser();

    const author = await usersClient.registerRandomUser();

    const article = await articlesClient.createRandomArticle(author.user.token);

    const favoriteArticleResponse = await request(app)
      .post(makeFavoriteArticleUrl(article.article.slug))
      .set('authorization', `Token ${user.user.token}`)
      .send();

    expect(favoriteArticleResponse.status).toBe(200);
    expect(favoriteArticleResponse.body).toStrictEqual({
      article: {
        ...article.article,
        favorited: true,
      },
    });
  });

  test('given article does not exist should return http status code 404 and an errors object', async () => {
    const user = await usersClient.registerRandomUser();

    const slug = slugify(faker.lorem.sentence());

    const favoriteArticleResponse = await request(app)
      .post(makeFavoriteArticleUrl(slug))
      .set('authorization', `Token ${user.user.token}`)
      .send();

    expect(favoriteArticleResponse.status).toBe(404);
    expect(favoriteArticleResponse.body).toStrictEqual({
      errors: {
        body: [`article "${slug}" not found`],
      },
    });
  });

  test('given no authorization header is set should return http status code 401 and an errors object', async () => {
    const author = await usersClient.registerRandomUser();

    const article = await articlesClient.createRandomArticle(author.user.token);

    const favoriteArticleResponse = await request(app)
      .post(makeFavoriteArticleUrl(article.article.slug))
      .send();

    expect(favoriteArticleResponse.status).toBe(401);
    expect(favoriteArticleResponse.body).toStrictEqual({
      errors: {
        body: ['unauthorized'],
      },
    });
  });

  test('given token has wrong issuer should return http status code 401 and an errors object', async () => {
    const issuer = faker.internet.url();

    const token = jwt.getRandomToken({issuer});

    const author = await usersClient.registerRandomUser();

    const article = await articlesClient.createRandomArticle(author.user.token);

    const favoriteArticleResponse = await request(app)
      .post(makeFavoriteArticleUrl(article.article.slug))
      .set('authorization', `Token ${token}`)
      .send();

    expect(favoriteArticleResponse.status).toBe(401);
    expect(favoriteArticleResponse.body).toStrictEqual({
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

    const article = await articlesClient.createRandomArticle(author.user.token);

    const favoriteArticleResponse = await request(app)
      .post(makeFavoriteArticleUrl(article.article.slug))
      .set('authorization', `Token ${token}`)
      .send();

    expect(favoriteArticleResponse.status).toBe(401);
    expect(favoriteArticleResponse.body).toStrictEqual({
      errors: {
        body: ['unauthorized'],
      },
    });
  });
});
