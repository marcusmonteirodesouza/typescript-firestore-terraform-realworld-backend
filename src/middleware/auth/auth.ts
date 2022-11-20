import {Request, Response, NextFunction} from 'express';
import {JWTService} from '../../users';
import {UnauthorizedError} from '../../errors';

class Auth {
  constructor(private jwtService: JWTService) {}

  requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = this.getToken(req);

      if (!token) {
        throw new UnauthorizedError(
          '"token" is required in "authorization" header'
        );
      }

      const user = await this.jwtService.getUser(token);

      if (!user) {
        throw new UnauthorizedError('"user" not found');
      }

      req.user = user;

      return next();
    } catch (err) {
      return next(err);
    }
  };

  optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = this.getToken(req);

      if (!token) {
        return next();
      }

      const user = await this.jwtService.getUser(token);

      if (!user) {
        throw new UnauthorizedError('"user" not found');
      }

      req.user = user;

      return next();
    } catch (err) {
      return next(err);
    }
  };

  private getToken = (req: Request) => {
    const authorizationHeader =
      req.header('Authorization') || req.header('authorization');

    if (!authorizationHeader) {
      return;
    }

    return authorizationHeader.split(' ')[1];
  };
}

export {Auth};
