import * as express from 'express';
import {Firestore} from '@google-cloud/firestore';
import {UsersService, UsersRouter, JWTService} from './users';
import {errorHandler} from './error-handler';
import {config} from './config';

const firestore = new Firestore({
  projectId: config.firestore.projectId,
});

const usersService = new UsersService(firestore);
const jwtService = new JWTService(config.jwt.secretKey, {
  issuer: config.jwt.issuer,
  secondsToExpiration: config.jwt.secondsToExpiration,
});
const usersRouter = new UsersRouter(usersService, jwtService).router;

const app = express();

app.use(express.json());

app.use(usersRouter);

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
