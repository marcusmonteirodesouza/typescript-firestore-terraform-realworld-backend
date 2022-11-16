import * as express from 'express';
import {Firestore} from '@google-cloud/firestore';
import {UsersService, UsersRouter, JWTService} from './users';
import {config} from './config';

const firestore = new Firestore();

const usersService = new UsersService(firestore);
const jwtService = new JWTService(config.jwt.secretKey, {
  issuer: config.jwt.issuer,
  secondsToExpiration: config.jwt.secondsToExpiration,
});
const usersRouter = new UsersRouter(usersService, jwtService).router;

const app = express();

app.use(express.json());

app.use(usersRouter);

export {app};
