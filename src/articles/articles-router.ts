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

    router.post('/articles', this.auth.requireAuth, async (req, res, next) => {
      try {
        const author = req.user!;

        const {article: createArticleParams} = req.body;

        const article = await this.articlesService.createArticle(
          author.id,
          createArticleParams
        );

        console.log(article);

        const authorProfile = await this.profilesService.getProfile(author.id);

        const articleDto = new ArticleDto(article, false, authorProfile);

        return res.json(articleDto);
      } catch (err) {
        return next(err);
      }
    });

    return router;
  }
}

export {ArticlesRouter};
