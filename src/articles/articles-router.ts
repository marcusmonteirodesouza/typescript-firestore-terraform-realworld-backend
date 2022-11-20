import {celebrate, Joi, Segments} from 'celebrate';
import * as express from 'express';
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

    return router;
  }
}

export {ArticlesRouter};
