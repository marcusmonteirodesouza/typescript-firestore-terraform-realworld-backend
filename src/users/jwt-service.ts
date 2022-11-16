import * as jwt from 'jsonwebtoken';
import {User} from './user';

interface JWTOptions {
  issuer: string;
  secondsToExpiration: number;
}

class JWTService {
  constructor(private jwtSecretKey: string, private jwtOptions: JWTOptions) {}

  getToken(user: User) {
    const token = jwt.sign({}, this.jwtSecretKey, {
      subject: user.id,
      issuer: this.jwtOptions.issuer,
      expiresIn: `${this.jwtOptions.secondsToExpiration}s`,
    });

    return token;
  }
}

export {JWTService};
