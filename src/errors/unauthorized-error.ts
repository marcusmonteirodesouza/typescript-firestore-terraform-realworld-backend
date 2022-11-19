class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export {UnauthorizedError};
