import {celebrate, Joi, Segments} from 'celebrate';
import * as express from 'express';
import {StatusCodes} from 'http-status-codes';
import {NotFoundError, UnauthorizedError} from '../errors';
import {Auth} from '../middleware';
import {Profile, ProfilesService} from '../profiles';
import {UsersService} from '../users';
import {Article} from './article';
import {ArticlesService} from './articles-service';
import {Comment} from './comment';

class ArticleDto {
  readonly article;

  constructor(article: Article, favorited: boolean, author: Profile) {
    this.article = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: favorited,
      favoritesCount: article.favoritedBy.length,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: author.following,
      },
    };
  }
}

class MultipleArticlesDto {
  readonly articles;
  readonly articlesCount;

  constructor(articlesDtos: ArticleDto[]) {
    this.articles = articlesDtos.map(article => article.article);
    this.articlesCount = articlesDtos.length;
  }
}

class CommentDto {
  public readonly comment;

  constructor(comment: Comment, author: Profile) {
    this.comment = {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: author.following,
      },
    };
  }
}

class MultipleCommentsDto {
  public readonly comments;

  constructor(commentsDtos: CommentDto[]) {
    this.comments = commentsDtos.map(comment => comment.comment);
  }
}

class ArticlesRouter {
  constructor(
    private readonly auth: Auth,
    private readonly articlesService: ArticlesService,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService
  ) {}

  get router() {
    const router = express.Router();

    router.post(
      '/articles',
      celebrate({
        [Segments.BODY]: Joi.object()
          .keys({
            article: Joi.object()
              .keys({
                title: Joi.string().required(),
                description: Joi.string().required(),
                body: Joi.string().required(),
                tagList: Joi.array().items(Joi.string()),
              })
              .required(),
          })
          .required(),
      }),
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const author = req.user!;

          const {article: articleBody} = req.body;

          const article = await this.articlesService.createArticle(author.id, {
            title: articleBody.title,
            description: articleBody.description,
            body: articleBody.body,
            tags: articleBody.tagList,
          });

          const authorProfile = await this.profilesService.getProfile(
            author.id
          );

          const articleDto = new ArticleDto(article, false, authorProfile);

          return res.status(StatusCodes.CREATED).json(articleDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.post(
      '/articles/:slug/favorite',
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const user = req.user!;

          const {slug} = req.params;

          await this.articlesService.favoriteArticleBySlug(slug, user.id);

          const article = (await this.articlesService.getArticleBySlug(slug))!;

          const authorProfile = await this.profilesService.getProfile(
            article.authorId
          );

          const articleDto = new ArticleDto(article, true, authorProfile);

          return res.json(articleDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.post(
      '/articles/:slug/comments',
      celebrate({
        [Segments.BODY]: Joi.object()
          .keys({
            comment: Joi.object()
              .keys({
                body: Joi.string().required(),
              })
              .required(),
          })
          .required(),
      }),
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const author = req.user!;

          const {slug} = req.params;

          const {body} = req.body.comment;

          const comment = await this.articlesService.addCommentBySlug(
            slug,
            author.id,
            body
          );

          const authorProfile = await this.profilesService.getProfile(
            author.id
          );

          const commentDto = new CommentDto(comment, authorProfile);

          return res.status(StatusCodes.CREATED).json(commentDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.get(
      '/articles/feed',
      celebrate({
        [Segments.QUERY]: Joi.object().keys({
          limit: Joi.number().integer(),
          offset: Joi.number().integer(),
        }),
      }),
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const {limit: limitString, offset: offsetString} = req.query;

          let limit;
          if (limitString) {
            limit = Number.parseInt(limitString as string);
          } else {
            limit = 20;
          }

          let offset;
          if (offsetString) {
            offset = Number.parseInt(offsetString as string);
          } else {
            offset = 0;
          }

          const user = req.user!;

          const articles = await this.articlesService.listUserFeed({
            userId: user.id,
            limit,
            offset,
          });

          // TODO(Marcus): Optimize this. Maybe get a list of profiles and then merge.
          const articlesDtos = await Promise.all(
            articles.map(async article => {
              const favorited = article.favoritedBy.includes(user.id);

              const authorProfile = await this.profilesService.getProfile(
                article.authorId,
                user.id
              );

              return new ArticleDto(article, favorited, authorProfile);
            })
          );

          return res.json(new MultipleArticlesDto(articlesDtos));
        } catch (err) {
          return next(err);
        }
      }
    );

    router.get(
      '/articles/:slug',
      this.auth.optionalAuth,
      async (req, res, next) => {
        try {
          const {slug} = req.params;

          const article = await this.articlesService.getArticleBySlug(slug);

          if (!article) {
            throw new NotFoundError(`slug "${slug}" not found`);
          }

          let authorProfile: Profile;
          let favorited = false;

          if (req.user) {
            authorProfile = await this.profilesService.getProfile(
              article.authorId,
              req.user.id
            );
            favorited = article.favoritedBy.includes(req.user.id);
          } else {
            authorProfile = await this.profilesService.getProfile(
              article.authorId
            );
          }

          const articleDto = new ArticleDto(article, favorited, authorProfile);

          return res.json(articleDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.get(
      '/articles',
      celebrate({
        [Segments.QUERY]: Joi.object().keys({
          tag: Joi.string(),
          author: Joi.string(),
          favorited: Joi.string(),
          limit: Joi.number().integer(),
          offset: Joi.number().integer(),
        }),
      }),
      this.auth.optionalAuth,
      async (req, res, next) => {
        try {
          const {
            tag,
            author: authorUsername,
            favorited: favoritedByUsername,
            limit: limitString,
            offset: offsetString,
          } = req.query;

          let authorId;
          if (authorUsername) {
            const author = await this.usersService.getUserByUsername(
              authorUsername as string
            );

            if (!author) {
              throw new NotFoundError(`author "${authorUsername}" not found`);
            }

            authorId = author.id;
          }

          let favoritedByUserId;
          if (favoritedByUsername) {
            const favoritedByUser = await this.usersService.getUserByUsername(
              favoritedByUsername as string
            );

            if (!favoritedByUser) {
              throw new NotFoundError(
                `user "${favoritedByUsername}" not found`
              );
            }

            favoritedByUserId = favoritedByUser.id;
          }

          let limit;
          if (limitString) {
            limit = Number.parseInt(limitString as string);
          } else {
            limit = 20;
          }

          let offset;
          if (offsetString) {
            offset = Number.parseInt(offsetString as string);
          } else {
            offset = 0;
          }

          const articles = await this.articlesService.listArticles({
            orderBy: [
              {
                field: 'createdAt',
                direction: 'desc',
              },
            ],
            tag: tag as string,
            authorId,
            favoritedByUserId,
            limit,
            offset,
          });

          // TODO(Marcus): Optimize this. Maybe get a list of profiles and then merge.
          const articlesDtos = await Promise.all(
            articles.map(async article => {
              let favorited = false;
              let authorProfile: Profile;

              if (req.user) {
                favorited = article.favoritedBy.includes(req.user.id);

                authorProfile = await this.profilesService.getProfile(
                  article.authorId,
                  req.user.id
                );
              } else {
                authorProfile = await this.profilesService.getProfile(
                  article.authorId
                );
              }

              return new ArticleDto(article, favorited, authorProfile);
            })
          );

          return res.json(new MultipleArticlesDto(articlesDtos));
        } catch (err) {
          return next(err);
        }
      }
    );

    router.get('/tags', async (req, res, next) => {
      try {
        const tags = await this.articlesService.listTags();

        return res.json({tags});
      } catch (err) {
        return next(err);
      }
    });

    router.get(
      '/articles/:slug/comments',
      this.auth.optionalAuth,
      async (req, res, next) => {
        try {
          const {slug} = req.params;

          const comments = await this.articlesService.listComments({
            orderBy: [
              {
                field: 'createdAt',
                direction: 'desc',
              },
            ],
            slug,
          });

          // TODO(Marcus): Optimize this. Maybe get a list of profiles and then merge.
          const commentsDtos = await Promise.all(
            comments.map(async comment => {
              const followerId = req.user?.id;

              const authorProfile = await this.profilesService.getProfile(
                comment.authorId,
                followerId
              );

              return new CommentDto(comment, authorProfile);
            })
          );

          return res.json(new MultipleCommentsDto(commentsDtos));
        } catch (err) {
          return next(err);
        }
      }
    );

    router.put(
      '/articles/:slug',
      celebrate({
        [Segments.BODY]: Joi.object()
          .keys({
            article: Joi.object()
              .keys({
                title: Joi.string(),
                description: Joi.string(),
                body: Joi.string(),
                tagList: Joi.array().items(Joi.string()),
              })
              .required(),
          })
          .required(),
      }),
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const author = req.user!;

          const {slug} = req.params;

          const article = await this.articlesService.getArticleBySlug(slug);

          if (!article) {
            throw new NotFoundError(`slug "${slug}" not found`);
          }

          if (author.id !== article.authorId) {
            throw new UnauthorizedError(
              `user ${author.id} unauthorized to update article ${article.id}`
            );
          }

          const {article: articleBody} = req.body;

          const updatedArticle = await this.articlesService.updateArticle(
            article.id,
            {
              title: articleBody.title,
              description: articleBody.description,
              body: articleBody.body,
              tags: articleBody.tagList,
            }
          );

          const authorProfile = await this.profilesService.getProfile(
            author.id
          );

          const articleDto = new ArticleDto(
            updatedArticle,
            false,
            authorProfile
          );

          return res.json(articleDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.delete(
      '/articles/:slug',
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const author = req.user!;

          const {slug} = req.params;

          const article = await this.articlesService.getArticleBySlug(slug);

          if (!article) {
            throw new NotFoundError(`slug "${slug}" not found`);
          }

          if (author.id !== article.authorId) {
            throw new UnauthorizedError(
              `user ${author.id} unauthorized to delete article ${article.id}`
            );
          }

          await this.articlesService.deleteArticleBySlug(slug);

          return res.sendStatus(StatusCodes.NO_CONTENT);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.delete(
      '/articles/:slug/favorite',
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const user = req.user!;

          const {slug} = req.params;

          await this.articlesService.unfavoriteArticleBySlug(slug, user.id);

          const article = (await this.articlesService.getArticleBySlug(slug))!;

          const authorProfile = await this.profilesService.getProfile(
            article.authorId
          );

          const articleDto = new ArticleDto(article, false, authorProfile);

          return res.json(articleDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    router.delete(
      '/articles/:slug/comments/:commentId',
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const author = req.user!;

          const {slug, commentId} = req.params;

          const comment = await this.articlesService.getCommentById(commentId);

          if (!comment) {
            throw new NotFoundError(`comment "${commentId}" not found`);
          }

          if (author.id !== comment.authorId) {
            throw new UnauthorizedError(
              `user ${author.id} unauthorized to delete comment ${comment.id}`
            );
          }

          const article = await this.articlesService.getArticleBySlug(slug);

          if (!article) {
            throw new NotFoundError(`slug "${slug}" not found`);
          }

          if (comment.articleId !== article.id) {
            throw new NotFoundError(
              `comment "${commentId}" not found in article with slug ${slug}`
            );
          }

          await this.articlesService.deleteCommentById(comment.id);

          return res.sendStatus(StatusCodes.NO_CONTENT);
        } catch (err) {
          return next(err);
        }
      }
    );

    return router;
  }
}

export {ArticlesRouter};
