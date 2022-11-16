import * as util from 'util';
import {Response} from 'express';
import {isCelebrateError} from 'celebrate';
import {StatusCodes} from 'http-status-codes';

class ErrorsDto {
  public readonly errors;

  constructor(errors: string[]) {
    this.errors = {
      body: errors,
    };
  }
}

class ErrorHandler {
  public async handleError(error: Error, res: Response) {
    console.error(
      util.inspect(error, {showHidden: false, depth: null, colors: true})
    );

    if (isCelebrateError(error)) {
      const errors = Array.from(error.details, ([, value]) => value.message);
      return res.status(StatusCodes.BAD_REQUEST).json(new ErrorsDto(errors));
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(new ErrorsDto(['internal server error']));
  }
}

export const errorHandler = new ErrorHandler();
