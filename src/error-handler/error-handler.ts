import * as util from 'util';
import {Response} from 'express';
import {isCelebrateError} from 'celebrate';
import {StatusCodes} from 'http-status-codes';
import {AlreadyExistsError} from '../errors';

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
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json(new ErrorsDto(errors));
    }

    if (error instanceof RangeError) {
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json(new ErrorsDto([error.message]));
    }

    if (error instanceof AlreadyExistsError) {
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json(new ErrorsDto([error.message]));
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(new ErrorsDto(['internal server error']));
  }
}

export const errorHandler = new ErrorHandler();
