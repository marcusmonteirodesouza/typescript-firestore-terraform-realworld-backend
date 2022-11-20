import * as request from 'supertest';
import * as assert from 'node:assert';
import {app} from '../../src/app';

class ProfilesClient {
  constructor() {}

  async followUser(token: string, username: string) {
    const response = await request(app)
      .post(`/profiles/${username}/follow`)
      .set('authorization', `Token ${token}`)
      .send();

    assert.strictEqual(response.statusCode, 200);

    return response.body;
  }
}

const profilesClient = new ProfilesClient();

export {profilesClient};
