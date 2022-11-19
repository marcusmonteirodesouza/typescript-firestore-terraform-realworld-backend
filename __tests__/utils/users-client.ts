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

    const {body} = await request(app).post('/users').send(requestBody);

    return {
      user: body.user,
      password,
    };
  }

  async registerRandomUser() {
    const email = faker.internet.email();
    const username = faker.internet.userName();
    const password = faker.internet.password();

    return await this.registerUser(email, username, password);
  }
}

const usersClient = new UsersClient();

export {usersClient};
