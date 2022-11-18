class AlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export {AlreadyExistsError};
