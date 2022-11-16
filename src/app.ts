import * as express from 'express';
import {Firestore} from '@google-cloud/firestore';
import {UsersService, UsersRouter} from './users';

const firestore = new Firestore();

const usersService = new UsersService(firestore);
const usersRouter = new UsersRouter(usersService).router;

const app = express();

app.use(express.json());

app.use(usersRouter);

export {app};
