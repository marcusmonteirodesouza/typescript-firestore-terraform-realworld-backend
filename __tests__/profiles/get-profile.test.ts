import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {jwt, profilesClient, usersClient} from '../utils';

describe('POST /profiles/:username/follow', () => {
  function makeGetProfileUrl(username: string) {
    return `/profiles/${username}`;
  }

  describe('given a valid request', () => {
    describe('given no authentication', () => {
      test('should return http status code 200 and the profile', async () => {
        const followee = await usersClient.registerRandomUser();

        const updateFolloweeData = {
          bio: faker.lorem.paragraphs(),
          image: faker.internet.url(),
        };

        const updatedFollowee = await usersClient.updateUser(
          followee.user.token,
          updateFolloweeData
        );

        const response = await request(app)
          .get(makeGetProfileUrl(followee.user.username))
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          profile: {
            username: updatedFollowee.user.username,
            following: false,
            bio: updatedFollowee.user.bio,
            image: updatedFollowee.user.image,
          },
        });
      });
    });

    describe('given authentication', () => {
      test('user is followed should return http status code 200 and the profile', async () => {
        const follower = await usersClient.registerRandomUser();
        const followee = await usersClient.registerRandomUser();

        const updateFolloweeData = {
          bio: faker.lorem.paragraphs(),
          image: faker.internet.url(),
        };

        const updatedFollowee = await usersClient.updateUser(
          followee.user.token,
          updateFolloweeData
        );

        await profilesClient.followUser(
          follower.user.token,
          followee.user.username
        );

        const response = await request(app)
          .get(makeGetProfileUrl(followee.user.username))
          .set('authorization', `Token ${follower.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          profile: {
            username: updatedFollowee.user.username,
            following: true,
            bio: updatedFollowee.user.bio,
            image: updatedFollowee.user.image,
          },
        });
      });

      test('given user is not followed should return http status code 200 and the profile', async () => {
        const follower = await usersClient.registerRandomUser();
        const followee = await usersClient.registerRandomUser();

        const updateFolloweeData = {
          bio: faker.lorem.paragraphs(),
          image: faker.internet.url(),
        };

        const updatedFollowee = await usersClient.updateUser(
          followee.user.token,
          updateFolloweeData
        );

        const response = await request(app)
          .get(makeGetProfileUrl(followee.user.username))
          .set('authorization', `Token ${follower.user.token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          profile: {
            username: updatedFollowee.user.username,
            following: false,
            bio: updatedFollowee.user.bio,
            image: updatedFollowee.user.image,
          },
        });
      });
    });
  });

  test('given followee is not found should return http status code 404 and an errors object', async () => {
    const followeeUsername = faker.internet.userName();

    const response = await request(app)
      .get(makeGetProfileUrl(followeeUsername))
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({
      errors: {
        body: [`username "${followeeUsername}" not found`],
      },
    });
  });

  describe('authentication errors', () => {
    test('given user is not found should return http status code 401 and an errors object', async () => {
      const token = jwt.getRandomToken();
      const followee = await usersClient.registerRandomUser();

      const response = await request(app)
        .get(makeGetProfileUrl(followee.user.username))
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
        .get(makeGetProfileUrl(followee.user.username))
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
      const follower = await usersClient.registerRandomUser();

      const followee = await usersClient.registerRandomUser();

      const expiresInSeconds = 1;

      const token = jwt.getRandomToken({
        subject: follower.user.id,
        expiresInSeconds,
      });

      await new Promise(r => setTimeout(r, expiresInSeconds * 1000 + 1));

      const response = await request(app)
        .get(makeGetProfileUrl(followee.user.username))
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
