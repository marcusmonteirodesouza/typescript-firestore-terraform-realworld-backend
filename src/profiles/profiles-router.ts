import * as express from 'express';
import {NotFoundError} from '../errors';
import {Auth} from '../middleware';
import {UsersService} from '../users';
import {ProfilesService} from './profiles-service';

class ProfileDto {
  readonly profile;

  constructor(
    username: string,
    following: boolean,
    bio?: string,
    image?: string
  ) {
    this.profile = {
      username,
      following,
      bio: bio || null,
      image: image || null,
    };
  }
}

class ProfilesRouter {
  constructor(
    private readonly auth: Auth,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService
  ) {}

  get router() {
    const router = express.Router();

    router.post(
      '/profiles/:username/follow',
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const follower = req.user!;

          const {username} = req.params;

          const followee = await this.usersService.getUserByUsername(username);

          if (!followee) {
            throw new NotFoundError(`username "${username}" not found`);
          }

          await this.profilesService.followUser(follower.id, followee.id);

          const profileDto = new ProfileDto(
            followee.username,
            true,
            followee.bio,
            followee.image
          );

          return res.json(profileDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.get(
      '/profiles/:username',
      this.auth.optionalAuth,
      async (req, res, next) => {
        try {
          const {username} = req.params;

          const followee = await this.usersService.getUserByUsername(username);

          if (!followee) {
            throw new NotFoundError(`username "${username}" not found`);
          }

          let isFollowing = false;
          if (req.user) {
            isFollowing = await this.profilesService.isFollowing(
              req.user.id,
              followee.id
            );
          }

          const profileDto = new ProfileDto(
            followee.username,
            isFollowing,
            followee.bio,
            followee.image
          );

          return res.json(profileDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.delete(
      '/profiles/:username/follow',
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const follower = req.user!;

          const {username} = req.params;

          const followee = await this.usersService.getUserByUsername(username);

          if (!followee) {
            throw new NotFoundError(`username "${username}" not found`);
          }

          await this.profilesService.unfollowUser(follower.id, followee.id);

          const profileDto = new ProfileDto(
            followee.username,
            false,
            followee.bio,
            followee.image
          );

          return res.json(profileDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    return router;
  }
}

export {ProfilesRouter};
