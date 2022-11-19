class User {
  private _id: string;
  private _email: string;
  private _username: string;
  private _bio: string | null;
  private _image: string | null;

  constructor(
    id: string,
    email: string,
    username: string,
    bio: string | null,
    image: string | null
  ) {
    this._id = id;
    this._email = email;
    this._username = username;
    this._bio = bio;
    this._image = image;
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get username(): string {
    return this._username;
  }

  get bio(): string | null {
    return this._bio;
  }

  get image(): string | null {
    return this._image;
  }
}

export {User};
