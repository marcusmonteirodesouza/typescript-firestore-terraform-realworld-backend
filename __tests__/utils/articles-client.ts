import * as request from 'supertest';
import * as assert from 'node:assert';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';

class ArticlesClient {
  constructor() {}

  async createRandomArticle(token: string) {
    const requestBody = {
      article: {
        title: faker.lorem.sentence(),
        description: faker.lorem.sentences(),
        body: faker.lorem.paragraphs(),
        tagList: faker.lorem.words().split(' '),
      },
    };

    const response = await request(app)
      .post('/articles')
      .set('authorization', `Token ${token}`)
      .send(requestBody);

    assert.strictEqual(response.statusCode, 201);

    return response.body;
  }

  async favoriteArticle(token: string, articleSlug: string) {
    const response = await request(app)
      .post(`/articles/${articleSlug}/favorite`)
      .set('authorization', `Token ${token}`)
      .send();

    assert.strictEqual(response.statusCode, 200);

    return response.body;
  }
}

const articlesClient = new ArticlesClient();

export {articlesClient};
