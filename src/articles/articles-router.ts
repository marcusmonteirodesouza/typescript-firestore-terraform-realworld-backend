import {celebrate, Joi, Segments} from 'celebrate';
import * as express from 'express';
import {NotFoundError, UnauthorizedError} from '../errors';
import {Auth} from '../middleware';
import {Profile, ProfilesService} from '../profiles';
import {Article} from './article';
import {ArticlesService} from './articles-service';
import {Comment} from './comment';

class ArticleDto {
  public readonly article;

  constructor(
    article: Article,
    favoritesCount: number,
    favorited: boolean,
    author: Profile
  ) {
    this.article = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: favorited,
      favoritesCount: favoritesCount,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: author.following,
      },
    };
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

  constructor(commentDtos: CommentDto[]) {
    this.comments = commentDtos.map(comment => comment.comment);
  }
}

class ArticlesRouter {
  constructor(
    private auth: Auth,
    private articlesService: ArticlesService,
    private profilesService: ProfilesService
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

          const {article: createArticleParams} = req.body;

          const article = await this.articlesService.createArticle(
            author.id,
            createArticleParams
          );

          const authorProfile = await this.profilesService.getProfile(
            author.id
          );

          const articleDto = new ArticleDto(article, 0, false, authorProfile);

          return res.status(201).json(articleDto);
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

          const favoritesCount = await this.articlesService.getFavoritesCount(
            article.id
          );

          const authorProfile = await this.profilesService.getProfile(
            article.authorId
          );

          const articleDto = new ArticleDto(
            article,
            favoritesCount,
            true,
            authorProfile
          );

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

          return res.status(201).json(commentDto);
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

          const favoritesCount = await this.articlesService.getFavoritesCount(
            article.id
          );

          let authorProfile: Profile;
          let favorited = false;

          if (req.user) {
            authorProfile = await this.profilesService.getProfile(
              article.authorId,
              req.user.id
            );
            favorited = await this.articlesService.isFavorited(
              article.id,
              req.user.id
            );
          } else {
            authorProfile = await this.profilesService.getProfile(
              article.authorId
            );
          }

          const articleDto = new ArticleDto(
            article,
            favoritesCount,
            favorited,
            authorProfile
          );

          return res.json(articleDto);
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

          const {article: updateArticleParams} = req.body;

          const updatedArticle = await this.articlesService.updateArticle(
            article.id,
            updateArticleParams
          );

          const favoritesCount = await this.articlesService.getFavoritesCount(
            updatedArticle.id
          );

          const authorProfile = await this.profilesService.getProfile(
            author.id
          );

          const articleDto = new ArticleDto(
            updatedArticle,
            favoritesCount,
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

          return res.sendStatus(204);
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

          const favoritesCount = await this.articlesService.getFavoritesCount(
            article.id
          );

          const authorProfile = await this.profilesService.getProfile(
            article.authorId
          );

          const articleDto = new ArticleDto(
            article,
            favoritesCount,
            false,
            authorProfile
          );

          return res.json(articleDto);
        } catch (err) {
          return next(err);
        }
      }
    );

    return router;
  }
}

export {ArticlesRouter};
