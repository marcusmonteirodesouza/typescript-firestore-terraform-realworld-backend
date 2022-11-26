class User {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly username: string,
    readonly bio?: string,
    readonly image?: string
  ) {}
}

export {User};
