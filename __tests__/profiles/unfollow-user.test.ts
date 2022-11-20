import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {jwt, profilesClient, usersClient} from '../utils';

describe('DELETE /profiles/:username/follow', () => {
  function makeUnfollowUserUrl(username: string) {
    return `/profiles/${username}/follow`;
  }

  describe('given a valid request', () => {
    test('given user is followed should return http status code 200 and the profile', async () => {
      const follower = await usersClient.registerRandomUser();
      const followee = await usersClient.registerRandomUser();

      await profilesClient.followUser(
        follower.user.token,
        followee.user.username
      );

      const unfollowUserResponse = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
        .set('authorization', `Token ${follower.user.token}`)
        .send();

      expect(unfollowUserResponse.status).toBe(200);
      expect(unfollowUserResponse.body).toStrictEqual({
        profile: {
          username: followee.user.username,
          following: false,
          bio: followee.user.bio,
          image: followee.user.image,
        },
      });

      const gotProfile = await profilesClient.getProfile(
        followee.user.username,
        followee.user.token
      );

      expect(unfollowUserResponse.body).toStrictEqual(gotProfile);
    });

    test('given user is not followed should return http status code 200 and the profile', async () => {
      const follower = await usersClient.registerRandomUser();
      const followee = await usersClient.registerRandomUser();

      const unfollowUserResponse = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
        .set('authorization', `Token ${follower.user.token}`)
        .send();

      expect(unfollowUserResponse.status).toBe(200);
      expect(unfollowUserResponse.body).toStrictEqual({
        profile: {
          username: followee.user.username,
          following: false,
          bio: followee.user.bio,
          image: followee.user.image,
        },
      });

      const gotProfile = await profilesClient.getProfile(
        followee.user.username,
        followee.user.token
      );

      expect(unfollowUserResponse.body).toStrictEqual(gotProfile);
    });

    test('given user tries to unfollow the same user should return http status code 200 and the profile', async () => {
      const follower = await usersClient.registerRandomUser();
      const followee = await usersClient.registerRandomUser();

      const unfollowUserResponse1 = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
        .set('authorization', `Token ${follower.user.token}`)
        .send();

      const unfollowUserResponse2 = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
        .set('authorization', `Token ${follower.user.token}`)
        .send();

      expect(unfollowUserResponse1.status).toBe(200);
      expect(unfollowUserResponse2.status).toBe(200);
      expect(unfollowUserResponse2.body).toStrictEqual(
        unfollowUserResponse1.body
      );

      const gotProfile = await profilesClient.getProfile(
        followee.user.username,
        followee.user.token
      );

      expect(unfollowUserResponse2.body).toStrictEqual(gotProfile);
    });
  });

  test('given user tries to unfollow ownself should return http status code 422 and an errors object', async () => {
    const follower = await usersClient.registerRandomUser();

    const response = await request(app)
      .delete(makeUnfollowUserUrl(follower.user.username))
      .set('authorization', `Token ${follower.user.token}`)
      .send();

    expect(response.status).toBe(422);
    expect(response.body).toStrictEqual({
      errors: {
        body: ['cannot unfollow ownself'],
      },
    });
  });

  test('given followee is not found should return http status code 404 and an errors object', async () => {
    const follower = await usersClient.registerRandomUser();
    const followeeUsername = faker.internet.userName();

    const response = await request(app)
      .delete(makeUnfollowUserUrl(followeeUsername))
      .set('authorization', `Token ${follower.user.token}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({
      errors: {
        body: [`username "${followeeUsername}" not found`],
      },
    });
  });

  describe('authentication errors', () => {
    test('given no authentication should return http status code 401 and an errors object', async () => {
      const followee = await usersClient.registerRandomUser();

      const response = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given user is not found should return http status code 401 and an errors object', async () => {
      const token = jwt.getRandomToken();
      const followee = await usersClient.registerRandomUser();

      const response = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
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

      const followee = await usersClient.registerRandomUser();

      const response = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
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

      const followee = await usersClient.registerRandomUser();

      const response = await request(app)
        .delete(makeUnfollowUserUrl(followee.user.username))
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
