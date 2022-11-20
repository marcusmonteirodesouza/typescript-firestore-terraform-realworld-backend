import * as request from 'supertest';
import * as assert from 'node:assert';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';

interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

class UsersClient {
  constructor() {}

  async registerUser(email: string, username: string, password: string) {
    const requestBody = {
      user: {
        email,
        username,
        password,
      },
    };

    const response = await request(app).post('/users').send(requestBody);

    assert.strictEqual(response.statusCode, 201);

    return {
      user: response.body.user,
      password,
    };
  }

  async registerRandomUser() {
    const email = faker.internet.email();
    const username = faker.internet.userName();
    const password = faker.internet.password();

    return await this.registerUser(email, username, password);
  }

  async login(email: string, password: string) {
    const requestBody = {
      user: {
        email,
        password,
      },
    };

    const response = await request(app).post('/users/login').send(requestBody);

    assert.strictEqual(response.statusCode, 200);

    return {
      user: response.body.user,
      password,
    };
  }

  async updateUser(token: string, updateUserData: UpdateUserData) {
    const requestBody = {
      user: updateUserData,
    };

    const response = await request(app)
      .put('/user')
      .set('authorization', `Token ${token}`)
      .send(requestBody);

    assert.strictEqual(response.statusCode, 200);

    return {
      user: response.body.user,
    };
  }
}

const usersClient = new UsersClient();

export {usersClient};
