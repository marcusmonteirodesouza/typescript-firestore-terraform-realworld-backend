import * as express from 'express';
import {StatusCodes} from 'http-status-codes';
import {celebrate, Joi, Segments} from 'celebrate';
import {UsersService} from './users-service';
import {JWTService} from './jwt-service';
import {NotFoundError, UnauthorizedError} from '../errors';
import {Auth} from '../middleware';

class UserDto {
  public readonly user;

  constructor(
    email: string,
    username: string,
    token: string,
    bio?: string,
    image?: string
  ) {
    this.user = {
      email,
      username,
      token,
      bio: bio || null,
      image: image || null,
    };
  }
}

class UsersRouter {
  constructor(
    private auth: Auth,
    private usersService: UsersService,
    private jwtService: JWTService
  ) {}

  get router() {
    const router = express.Router();

    router.post(
      '/users',
      celebrate({
        [Segments.BODY]: Joi.object()
          .keys({
            user: Joi.object()
              .keys({
                email: Joi.string().email().required(),
                username: Joi.string().required(),
                password: Joi.string().required(),
              })
              .required(),
          })
          .required(),
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

    router.post(
      '/users/login',
      celebrate({
        [Segments.BODY]: Joi.object()
          .keys({
            user: Joi.object()
              .keys({
                email: Joi.string().email().required(),
                password: Joi.string().required(),
              })
              .required(),
          })
          .required(),
      }),
      async (req, res, next) => {
        try {
          const {email, password} = req.body.user;

          try {
            const isValidPassword = await this.usersService.verifyPassword(
              email,
              password
            );

            if (!isValidPassword) {
              throw new UnauthorizedError(
                `invalid password for email "${email}"`
              );
            }
          } catch (err) {
            if (err instanceof NotFoundError) {
              throw new UnauthorizedError(`email ${email} not found`);
            }
            throw err;
          }

          const user = (await this.usersService.getUserByEmail(email))!;

          const token = this.jwtService.getToken(user);

          const userDto = new UserDto(
            user.email,
            user.username,
            token,
            user.bio,
            user.image
          );

          return res.json(userDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.get('/user', this.auth.requireAuth, async (req, res) => {
      const user = req.user!;

      const token = this.jwtService.getToken(user);

      const userDto = new UserDto(
        user.email,
        user.username,
        token,
        user.bio,
        user.image
      );

      return res.json(userDto);
    });

    router.put(
      '/user',
      celebrate({
        [Segments.BODY]: Joi.object()
          .keys({
            user: Joi.object()
              .keys({
                email: Joi.string().email(),
                username: Joi.string(),
                password: Joi.string(),
                bio: Joi.string(),
                image: Joi.string().uri(),
              })
              .required(),
          })
          .required(),
      }),
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const user = req.user!;

          const {user: updateUserData} = req.body;

          const updatedUser = await this.usersService.updateUser(
            user.id,
            updateUserData
          );

          const token = this.jwtService.getToken(updatedUser);

          const userDto = new UserDto(
            updatedUser.email,
            updatedUser.username,
            token,
            updatedUser.bio,
            updatedUser.image
          );

          return res.json(userDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    return router;
  }
}

export {UsersRouter};
