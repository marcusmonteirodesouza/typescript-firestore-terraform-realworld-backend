class Comment {
  private _id: string;
  private _articleId: string;
  private _authorId: string;
  private _body: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    articleId: string,
    authorId: string,
    body: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this._id = id;
    this._articleId = articleId;
    this._authorId = authorId;
    this._body = body;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id() {
    return this._id;
  }

  get articleId() {
    return this._articleId;
  }

  get authorId() {
    return this._authorId;
  }

  get body() {
    return this._body;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }
}

export {Comment};
