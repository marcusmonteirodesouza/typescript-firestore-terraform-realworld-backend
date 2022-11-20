import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {usersClient} from '../utils';

describe('POST /users', () => {
  const registerUserUrl = '/users';

  describe('given a valid request', () => {
    test('should return http status code 201 and the created user', async () => {
      const requestBody = {
        user: {
          email: faker.internet.email(),
          username: faker.internet.userName(),
          password: faker.internet.password(),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual({
        user: {
          email: requestBody.user.email,
          username: requestBody.user.username,
          token: expect.not.toBeEmpty(),
          bio: null,
          image: null,
        },
      });
    });
  });

  describe('email validation', () => {
    test('given no email should return http status code 422 and an errors object', async () => {
      const requestBody = {
        user: {
          username: faker.internet.userName(),
          password: faker.internet.password(),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

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
          username: faker.internet.userName(),
          password: faker.internet.password(),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"user.email" must be a valid email'],
        },
      });
    });

    test('given email is taken should return http status code 422 and an errors object', async () => {
      const existingUser = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: existingUser.user.email,
          username: faker.internet.userName(),
          password: faker.internet.password(),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"email" is taken'],
        },
      });
    });
  });

  describe('username validation', () => {
    test('given no username should return http status code 422 and an errors object', async () => {
      const requestBody = {
        user: {
          email: faker.internet.email(),
          password: faker.internet.password(),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"user.username" is required'],
        },
      });
    });

    test('given username is taken should return http status code 422 and an errors object', async () => {
      const existingUser = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: faker.internet.email(),
          username: existingUser.user.username,
          password: faker.internet.password(),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"username" is taken'],
        },
      });
    });
  });

  describe('password validation', () => {
    test('given no password should return http status code 422 and an errors object', async () => {
      const requestBody = {
        user: {
          email: faker.internet.email(),
          username: faker.internet.userName(),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"user.password" is required'],
        },
      });
    });

    test('given password is less than 8 characters should return http status code 422 and an errors object', async () => {
      const requestBody = {
        user: {
          email: faker.internet.email(),
          username: faker.internet.userName(),
          password: faker.lorem.word(7),
        },
      };

      const response = await request(app)
        .post(registerUserUrl)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"password" must contain at least 8 characters'],
        },
      });
    });
  });
});
