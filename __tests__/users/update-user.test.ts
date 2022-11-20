import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {usersClient, jwt} from '../utils';

describe('PUT /user', () => {
  const updateUserUrl = '/user';

  describe('given a valid request', () => {
    test('given all fields set should return http status code 200 and the user', async () => {
      const userAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: faker.internet.email(),
          username: faker.internet.userName(),
          password: faker.internet.password(),
          bio: faker.lorem.paragraphs(),
          image: faker.internet.url(),
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        user: {
          email: requestBody.user.email,
          username: requestBody.user.username,
          token: expect.not.toBeEmpty(),
          bio: requestBody.user.bio,
          image: requestBody.user.image,
        },
      });

      const loggedUserAndPassword = await usersClient.login(
        requestBody.user.email,
        requestBody.user.password
      );

      expect(loggedUserAndPassword.user).toStrictEqual({
        email: requestBody.user.email,
        username: requestBody.user.username,
        token: expect.not.toBeEmpty(),
        bio: requestBody.user.bio,
        image: requestBody.user.image,
      });
    });

    test('given valid email should return http status code 200 and the user', async () => {
      const userAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: faker.internet.email(),
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        user: {
          email: requestBody.user.email,
          username: userAndPassword.user.username,
          token: expect.not.toBeEmpty(),
          bio: userAndPassword.user.bio,
          image: userAndPassword.user.image,
        },
      });

      const loggedUserAndPassword = await usersClient.login(
        requestBody.user.email,
        userAndPassword.password
      );

      expect(loggedUserAndPassword.user).toStrictEqual({
        email: requestBody.user.email,
        username: userAndPassword.user.username,
        token: expect.not.toBeEmpty(),
        bio: userAndPassword.user.bio,
        image: userAndPassword.user.image,
      });
    });

    test('given a same email as the calling user should return http status code 200 and the user', async () => {
      const userAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: userAndPassword.user.email,
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
        .send(requestBody);

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

      const loggedUserAndPassword = await usersClient.login(
        userAndPassword.user.email,
        userAndPassword.password
      );

      expect(loggedUserAndPassword.user).toStrictEqual({
        email: userAndPassword.user.email,
        username: userAndPassword.user.username,
        token: expect.not.toBeEmpty(),
        bio: userAndPassword.user.bio,
        image: userAndPassword.user.image,
      });
    });

    test('given a valid username should return http status code 200 and the user', async () => {
      const userAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          username: faker.internet.userName(),
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        user: {
          email: userAndPassword.user.email,
          username: requestBody.user.username,
          token: expect.not.toBeEmpty(),
          bio: userAndPassword.user.bio,
          image: userAndPassword.user.image,
        },
      });

      const loggedUserAndPassword = await usersClient.login(
        userAndPassword.user.email,
        userAndPassword.password
      );

      expect(loggedUserAndPassword.user).toStrictEqual({
        email: userAndPassword.user.email,
        username: requestBody.user.username,
        token: expect.not.toBeEmpty(),
        bio: userAndPassword.user.bio,
        image: userAndPassword.user.image,
      });
    });

    test('given the same username as the calling user should return http status code 200 and the user', async () => {
      const userAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          username: userAndPassword.user.username,
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
        .send(requestBody);

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

      const loggedUserAndPassword = await usersClient.login(
        userAndPassword.user.email,
        userAndPassword.password
      );

      expect(loggedUserAndPassword.user).toStrictEqual({
        email: userAndPassword.user.email,
        username: userAndPassword.user.username,
        token: expect.not.toBeEmpty(),
        bio: userAndPassword.user.bio,
        image: userAndPassword.user.image,
      });
    });
  });

  test('given a valid password should return http status code 200 and the user', async () => {
    const userAndPassword = await usersClient.registerRandomUser();

    const requestBody = {
      user: {
        password: faker.internet.password(),
      },
    };

    const response = await request(app)
      .put(updateUserUrl)
      .set('authorization', `Token ${userAndPassword.user.token}`)
      .send(requestBody);

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

    const loggedUserAndPassword = await usersClient.login(
      userAndPassword.user.email,
      requestBody.user.password
    );

    expect(loggedUserAndPassword.user).toStrictEqual({
      email: userAndPassword.user.email,
      username: userAndPassword.user.username,
      token: expect.not.toBeEmpty(),
      bio: userAndPassword.user.bio,
      image: userAndPassword.user.image,
    });
  });

  test('given a valid bio should return http status code 200 and the user', async () => {
    const userAndPassword = await usersClient.registerRandomUser();

    const requestBody = {
      user: {
        bio: faker.lorem.paragraphs(),
      },
    };

    const response = await request(app)
      .put(updateUserUrl)
      .set('authorization', `Token ${userAndPassword.user.token}`)
      .send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      user: {
        email: userAndPassword.user.email,
        username: userAndPassword.user.username,
        token: expect.not.toBeEmpty(),
        bio: requestBody.user.bio,
        image: userAndPassword.user.image,
      },
    });

    const loggedUserAndPassword = await usersClient.login(
      userAndPassword.user.email,
      userAndPassword.password
    );

    expect(loggedUserAndPassword.user).toStrictEqual({
      email: userAndPassword.user.email,
      username: userAndPassword.user.username,
      token: expect.not.toBeEmpty(),
      bio: requestBody.user.bio,
      image: userAndPassword.user.image,
    });
  });

  test('given a valid image should return http status code 200 and the user', async () => {
    const userAndPassword = await usersClient.registerRandomUser();

    const requestBody = {
      user: {
        image: faker.internet.url(),
      },
    };

    const response = await request(app)
      .put(updateUserUrl)
      .set('authorization', `Token ${userAndPassword.user.token}`)
      .send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      user: {
        email: userAndPassword.user.email,
        username: userAndPassword.user.username,
        token: expect.not.toBeEmpty(),
        bio: userAndPassword.user.bio,
        image: requestBody.user.image,
      },
    });

    const loggedUserAndPassword = await usersClient.login(
      userAndPassword.user.email,
      userAndPassword.password
    );

    expect(loggedUserAndPassword.user).toStrictEqual({
      email: userAndPassword.user.email,
      username: userAndPassword.user.username,
      token: expect.not.toBeEmpty(),
      bio: userAndPassword.user.bio,
      image: requestBody.user.image,
    });
  });

  describe('email validation', () => {
    test('given an invalid email should return http status code 422 and an errors object', async () => {
      const userAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: 'invalid',
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"user.email" must be a valid email'],
        },
      });
    });

    test('given email is taken should return http status code 422 and an errors object', async () => {
      const userAndPassword = await usersClient.registerRandomUser();
      const anotherUserAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          email: anotherUserAndPassword.user.email,
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
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
    test('given username is taken should return http status code 422 and an errors object', async () => {
      const userAndPassword = await usersClient.registerRandomUser();
      const anotherUserAndPassword = await usersClient.registerRandomUser();

      const requestBody = {
        user: {
          username: anotherUserAndPassword.user.username,
        },
      };

      const response = await request(app)
        .put(updateUserUrl)
        .set('authorization', `Token ${userAndPassword.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"username" is taken'],
        },
      });
    });
  });

  describe('authentication errors', () => {
    test('given no authentication should return http status code 401 and an errors object', async () => {
      const response = await request(app).put(updateUserUrl).send();

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
        .put(updateUserUrl)
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
        .put(updateUserUrl)
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
        .put(updateUserUrl)
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
