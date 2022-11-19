import * as jwt from 'jsonwebtoken';
import {faker} from '@faker-js/faker';
import {config} from '../../src/config';

interface RandomTokenOptions {
  issuer?: string;
  expiresInSeconds?: number;
}

function getRandomToken(options?: RandomTokenOptions) {
  const signOptions = {
    subject: faker.datatype.uuid(),
    issuer: config.jwt.issuer,
    expiresIn: `${config.jwt.secondsToExpiration}s`,
  };

  if (options) {
    if (options.issuer) {
      signOptions.issuer = options.issuer;
    }

    if (options.expiresInSeconds) {
      signOptions.expiresIn = `${options.expiresInSeconds}s`;
    }
  }

  const token = jwt.sign({}, config.jwt.secretKey, signOptions);

  return token;
}

export {getRandomToken};
