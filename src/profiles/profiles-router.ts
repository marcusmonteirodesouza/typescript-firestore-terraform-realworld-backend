import * as express from 'express';
import {NotFoundError} from '../errors';
import {Auth} from '../middleware';
import {UsersService} from '../users';
import {ProfilesService} from './profiles-service';

class ProfileDto {
  public readonly profile;

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
    private auth: Auth,
    private usersService: UsersService,
    private profilesService: ProfilesService
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

          this.profilesService.followUser(follower.id, followee.id);

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

    return router;
  }
}

export {ProfilesRouter};
