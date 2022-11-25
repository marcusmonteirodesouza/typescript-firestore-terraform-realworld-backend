class Article {
  private _id: string;
  private _authorId: string;
  private _slug: string;
  private _title: string;
  private _description: string;
  private _body: string;
  private _tagList: string[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    authorId: string,
    slug: string,
    title: string,
    description: string,
    body: string,
    tagList: string[],
    createdAt: Date,
    updatedAt: Date
  ) {
    this._id = id;
    this._authorId = authorId;
    this._slug = slug;
    this._title = title;
    this._description = description;
    this._body = body;
    this._tagList = tagList;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id() {
    return this._id;
  }

  get authorId() {
    return this._authorId;
  }

  get slug() {
    return this._slug;
  }

  get title() {
    return this._title;
  }

  get description() {
    return this._description;
  }

  get body() {
    return this._body;
  }

  get tagList() {
    return this._tagList;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }
}

export {Article};
