class User {
  private _id: string;
  private _email: string;
  private _username: string;
  private _bio?: string;
  private _image?: string;

  constructor(
    id: string,
    email: string,
    username: string,
    bio?: string,
    image?: string
  ) {
    this._id = id;
    this._email = email;
    this._username = username;
    this._bio = bio;
    this._image = image;
  }

  get id() {
    return this._id;
  }

  get email() {
    return this._email;
  }

  get username() {
    return this._username;
  }

  get bio() {
    return this._bio;
  }

  get image() {
    return this._image;
  }
}

export {User};
