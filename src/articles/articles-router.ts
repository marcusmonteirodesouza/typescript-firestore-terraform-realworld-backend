import {celebrate, Joi, Segments} from 'celebrate';
import * as express from 'express';
import {NotFoundError} from '../errors';
import {Auth} from '../middleware';
import {Profile, ProfilesService} from '../profiles';
import {Article} from './article';
import {ArticlesService} from './articles-service';

class ArticleDto {
  public readonly article;

  constructor(article: Article, favorited: boolean, author: Profile) {
    this.article = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: favorited,
      favoritesCount: article.favoritesCount,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: author.following,
      },
    };
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
        [Segments.BODY]: Joi.object().keys({
          article: Joi.object().keys({
            title: Joi.string().required(),
            description: Joi.string().required(),
            body: Joi.string().required(),
            tagList: Joi.array().items(Joi.string()),
          }),
        }),
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

          const articleDto = new ArticleDto(article, false, authorProfile);

          return res.status(201).json(articleDto);
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
            favorited = await this.articlesService.isFavorited(
              article.id,
              req.user.id
            );
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

    router.post(
      '/articles/:slug/favorite',
      this.auth.requireAuth,
      async (req, res, next) => {
        try {
          const user = req.user!;

          const {slug} = req.params;

          const article = await this.articlesService.favoriteArticleBySlug(
            slug,
            user.id
          );

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

    return router;
  }
}

export {ArticlesRouter};
