import 'jest-extended';
import * as request from 'supertest';
import slugify from 'slugify';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, jwt, usersClient} from '../utils';

describe('DELETE /articles/:slug/comments/:commentId', () => {
  function makeDeleteCommentUrl(articleSlug: string, commentId: string) {
    return `/articles/${articleSlug}/comments/${commentId}`;
  }

  describe('given a valid request', () => {
    test('should return http status code 204', async () => {
      const articleAuthor = await usersClient.registerRandomUser();

      const commentAuthor = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        articleAuthor.user.token
      );

      const comment = await articlesClient.addRandomComment(
        commentAuthor.user.token,
        article.article.slug
      );

      const response = await request(app)
        .delete(makeDeleteCommentUrl(article.article.slug, comment.comment.id))
        .set('authorization', `Token ${commentAuthor.user.token}`)
        .send();

      expect(response.status).toBe(204);
      expect(response.body).toBeEmpty();

      const articleComments = await articlesClient.getCommentsFromArticle(
        article.article.slug
      );

      expect(articleComments.comments).toBeEmpty();
    });
  });

  test('given article does not exist should return http status code 404 and an errors object', async () => {
    const anArticleAuthor = await usersClient.registerRandomUser();

    const anArticle = await articlesClient.createRandomArticle(
      anArticleAuthor.user.token
    );

    const aCommentAuthor = await usersClient.registerRandomUser();

    const aComment = await articlesClient.addRandomComment(
      aCommentAuthor.user.token,
      anArticle.article.slug
    );

    const slug = slugify(faker.lorem.sentence());

    const response = await request(app)
      .delete(makeDeleteCommentUrl(slug, aComment.comment.id))
      .set('authorization', `Token ${aCommentAuthor.user.token}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({
      errors: {
        body: [`slug "${slug}" not found`],
      },
    });
  });

  test('given comment does not exist should return http status code 404 and an errors object', async () => {
    const articleAuthor = await usersClient.registerRandomUser();

    const article = await articlesClient.createRandomArticle(
      articleAuthor.user.token
    );

    const aCommentAuthor = await usersClient.registerRandomUser();

    await articlesClient.addRandomComment(
      aCommentAuthor.user.token,
      article.article.slug
    );

    const commentId = faker.datatype.uuid();

    const response = await request(app)
      .delete(makeDeleteCommentUrl(article.article.slug, commentId))
      .set('authorization', `Token ${aCommentAuthor.user.token}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({
      errors: {
        body: [`comment "${commentId}" not found`],
      },
    });
  });

  describe('authentication errors', () => {
    test('given comment does not belong to the user should return http status code 401 and an errors object', async () => {
      const user = await usersClient.registerRandomUser();

      const articleAuthor = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        articleAuthor.user.token
      );

      const commentAuthor = await usersClient.registerRandomUser();

      const comment = await articlesClient.addRandomComment(
        commentAuthor.user.token,
        article.article.slug
      );

      const response = await request(app)
        .delete(makeDeleteCommentUrl(article.article.slug, comment.comment.id))
        .set('authorization', `Token ${user.user.token}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given no authentication should return http status code 401 and an errors object', async () => {
      const articleAuthor = await usersClient.registerRandomUser();

      const commentAuthor = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        articleAuthor.user.token
      );

      const comment = await articlesClient.addRandomComment(
        commentAuthor.user.token,
        article.article.slug
      );

      const response = await request(app)
        .delete(makeDeleteCommentUrl(article.article.slug, comment.comment.id))
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

      const articleAuthor = await usersClient.registerRandomUser();

      const commentAuthor = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        articleAuthor.user.token
      );

      const comment = await articlesClient.addRandomComment(
        commentAuthor.user.token,
        article.article.slug
      );

      const response = await request(app)
        .delete(makeDeleteCommentUrl(article.article.slug, comment.comment.id))
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

      const articleAuthor = await usersClient.registerRandomUser();

      const commentAuthor = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        articleAuthor.user.token
      );

      const comment = await articlesClient.addRandomComment(
        commentAuthor.user.token,
        article.article.slug
      );

      const response = await request(app)
        .delete(makeDeleteCommentUrl(article.article.slug, comment.comment.id))
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
      const articleAuthor = await usersClient.registerRandomUser();

      const commentAuthor = await usersClient.registerRandomUser();

      const article = await articlesClient.createRandomArticle(
        articleAuthor.user.token
      );

      const comment = await articlesClient.addRandomComment(
        commentAuthor.user.token,
        article.article.slug
      );

      const expiresInSeconds = 1;

      const token = jwt.getRandomToken({
        subject: commentAuthor.user.id,
        expiresInSeconds,
      });

      await new Promise(r => setTimeout(r, expiresInSeconds * 1000 + 1));

      const response = await request(app)
        .delete(makeDeleteCommentUrl(article.article.slug, comment.comment.id))
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
