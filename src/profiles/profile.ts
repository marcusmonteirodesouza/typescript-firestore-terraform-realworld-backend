class Profile {
  constructor(
    readonly username: string,
    readonly following: boolean,
    readonly bio?: string,
    readonly image?: string
  ) {}
}

export {Profile};
