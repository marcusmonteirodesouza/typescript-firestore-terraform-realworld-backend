import 'jest-extended';
import * as request from 'supertest';
import {app} from '../../src/app';
import {articlesClient, clearFirestore, usersClient} from '../utils';

describe('GET /api/tags', () => {
  const getTagsUrl = '/api/tags';

  beforeEach(async () => {
    await clearFirestore();
  });

  describe('given a valid request', () => {
    test('should return http status code 200 and the list of tags', async () => {
      const author1 = await usersClient.registerRandomUser();

      const author2 = await usersClient.registerRandomUser();

      const article1 = await articlesClient.createRandomArticle(
        author1.user.token
      );

      const article2 = await articlesClient.createRandomArticle(
        author2.user.token
      );

      const response = await request(app).get(getTagsUrl).send();

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        tags: [...article1.article.tagList, ...article2.article.tagList].sort(),
      });
    });
  });
});
