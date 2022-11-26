class Article {
  constructor(
    readonly id: string,
    readonly authorId: string,
    readonly slug: string,
    readonly title: string,
    readonly description: string,
    readonly body: string,
    readonly tags: string[],
    readonly favoritedBy: string[],
    readonly createdAt: Date,
    readonly updatedAt: Date
  ) {}
}

export {Article};
