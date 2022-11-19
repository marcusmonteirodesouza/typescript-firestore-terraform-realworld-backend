import * as express from 'express';
import {StatusCodes} from 'http-status-codes';
import {celebrate, Joi, Segments} from 'celebrate';
import {UsersService} from './users-service';
import {JWTService} from './jwt-service';

class UserDto {
  public readonly user;

  constructor(
    email: string,
    username: string,
    token: string,
    bio: string | null,
    image: string | null
  ) {
    this.user = {
      email,
      username,
      token,
      bio,
      image,
    };
  }
}

class UsersRouter {
  constructor(
    private usersService: UsersService,
    private jwtService: JWTService
  ) {}

  get router() {
    const router = express.Router();

    router.post(
      '/users',
      celebrate({
        [Segments.BODY]: Joi.object().keys({
          user: Joi.object().keys({
            email: Joi.string().email().required(),
            username: Joi.string().required(),
            password: Joi.string().required(),
          }),
        }),
      }),
      async (req, res, next) => {
        try {
          const {email, username, password} = req.body.user;

          const user = await this.usersService.registerUser(
            email,
            username,
            password
          );

          const token = this.jwtService.getToken(user);

          const userDto = new UserDto(
            user.email,
            user.username,
            token,
            user.bio,
            user.image
          );

          return res.status(StatusCodes.CREATED).json(userDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    return router;
  }
}

export {UsersRouter};
