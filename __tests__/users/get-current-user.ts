import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {usersClient, jwt} from '../utils';

describe('GET /user', () => {
  const getCurrentUserUrl = '/user';

  test('given a valid request should return http status code 200 and the user', async () => {
    const userAndPassword = await usersClient.registerRandomUser();

    const response = await request(app)
      .get(getCurrentUserUrl)
      .set('authorization', `Token ${userAndPassword.user.token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      user: {
        email: userAndPassword.user.email,
        username: userAndPassword.user.username,
        token: expect.not.toBeEmpty(),
        bio: userAndPassword.user.bio,
        image: userAndPassword.user.image,
      },
    });
  });

  test('given no authorization header is set should return http status code 401 and an errors object', async () => {
    const response = await request(app).get(getCurrentUserUrl).send();

    expect(response.status).toBe(401);
    expect(response.body).toStrictEqual({
      errors: {
        body: ['unauthorized'],
      },
    });
  });

  test('given user is not found should return http status code 401 and an errors object', async () => {
    const token = jwt.getRandomToken();

    const response = await request(app)
      .get(getCurrentUserUrl)
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
      .get(getCurrentUserUrl)
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
    const expiresInSeconds = 1;

    const token = jwt.getRandomToken({expiresInSeconds});

    await new Promise(r => setTimeout(r, expiresInSeconds * 1000 + 1));

    const response = await request(app)
      .get(getCurrentUserUrl)
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
