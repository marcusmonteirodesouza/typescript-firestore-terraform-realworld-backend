class Profile {
  private _username: string;
  private _following: boolean;
  private _bio?: string;
  private _image?: string;

  constructor(
    username: string,
    following: boolean,
    bio?: string,
    image?: string
  ) {
    this._username = username;
    this._following = following;
    this._bio = bio;
    this._image = image;
  }

  get username() {
    return this._username;
  }

  get following() {
    return this._following;
  }

  get bio() {
    return this._bio;
  }

  get image() {
    return this._image;
  }
}

export {Profile};
