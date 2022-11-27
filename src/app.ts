import * as express from 'express';
import {Firestore} from '@google-cloud/firestore';
import {UsersService, UsersRouter, JWTService} from './users';
import {errorHandler} from './error-handler';
import {config} from './config';
import {Auth} from './middleware';
import {ProfilesRouter, ProfilesService} from './profiles';
import {ArticlesRouter, ArticlesService} from './articles';

const firestore = new Firestore({
  projectId: config.firestore.projectId,
});

const usersService = new UsersService(firestore);

const jwtService = new JWTService(usersService, config.jwt.secretKey, {
  issuer: config.jwt.issuer,
  secondsToExpiration: config.jwt.secondsToExpiration,
});

const profilesService = new ProfilesService(firestore, usersService);

const articlesService = new ArticlesService(
  firestore,
  usersService,
  profilesService
);

const auth = new Auth(jwtService);

const usersRouter = new UsersRouter(auth, usersService, jwtService).router;

const profilesRouter = new ProfilesRouter(auth, usersService, profilesService)
  .router;

const articlesRouter = new ArticlesRouter(
  auth,
  articlesService,
  usersService,
  profilesService
).router;

const app = express();

app.use(express.json());

app.use('/api', usersRouter);

app.use('/api', profilesRouter);

app.use('/api', articlesRouter);

app.use(
  async (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    await errorHandler.handleError(err, res);
  }
);

export {app};
