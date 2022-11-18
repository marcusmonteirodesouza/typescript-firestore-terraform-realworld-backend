import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';

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

    return response;
  }

  async registerUserAndDecode(
    email: string,
    username: string,
    password: string
  ) {
    const {body: user} = await this.registerUser(email, username, password);

    return user;
  }

  async registerRandomUserAndDecode() {
    const email = faker.internet.email();
    const username = faker.internet.userName();
    const password = faker.internet.password();

    return await this.registerUserAndDecode(email, username, password);
  }
}

const usersClient = new UsersClient();

export {usersClient};
