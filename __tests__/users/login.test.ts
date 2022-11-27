import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {usersClient} from '../utils';

describe('POST /api/users/login', () => {
  const loginUrl = '/api/users/login';

  describe('given a valid request', () => {
    test('should return http status code 200 and the user', async () => {
      const user = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: user.user.email,
          password: user.password,
        },
      };

      const response = await request(app).post(loginUrl).send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        user: {
          email: user.user.email,
          username: user.user.username,
          token: expect.not.toBeEmpty(),
          bio: user.user.bio,
          image: user.user.image,
        },
      });
    });
  });

  describe('email validation', () => {
    test('given no email should return http status code 422 and an errors object', async () => {
      const requestBody = {
        user: {
          password: faker.internet.password(),
        },
      };

      const response = await request(app).post(loginUrl).send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"user.email" is required'],
        },
      });
    });

    test('given an invalid email should return http status code 422 and an errors object', async () => {
      const requestBody = {
        user: {
          email: 'invalid',
          password: faker.internet.password(),
        },
      };

      const response = await request(app).post(loginUrl).send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"user.email" must be a valid email'],
        },
      });
    });

    test('given email is not found should return http status code 401 and an errors object', async () => {
      const user = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: faker.internet.email(),
          password: user.password,
        },
      };

      const response = await request(app).post(loginUrl).send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });

  describe('password validation', () => {
    test('given no password should return http status code 422 and an errors object', async () => {
      const requestBody = {
        user: {
          email: faker.internet.email(),
        },
      };

      const response = await request(app).post(loginUrl).send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"user.password" is required'],
        },
      });
    });

    test('given password does not match should return http status code 401 and an errors object', async () => {
      const user = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: user.user.email,
          password: faker.internet.password(),
        },
      };

      const response = await request(app).post(loginUrl).send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});
