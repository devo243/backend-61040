import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FavoriteDoc extends BaseDoc {
  user: ObjectId;
  item: ObjectId;
}

/**
 * concept: Favoriting [User, Item]
 */
export default class FavoritingConcept {
  public readonly favorites: DocCollection<FavoriteDoc>;

  constructor(collectionName: string) {
    this.favorites = new DocCollection<FavoriteDoc>(collectionName);
  }

  async favorite(user: ObjectId, item: ObjectId) {
    this.assertItemIsNotFavorite(user, item);

    const _id = await this.favorites.createOne({ user, item });

    return { msg: "A user has favorited an item!", favorite: await this.favorites.readOne({ _id }) };
  }

  async unfavorite(user: ObjectId, item: ObjectId) {
    this.assertItemIsFavorite(user, item);

    await this.favorites.deleteOne({ user: user, item: item });

    return { msg: "A user has unfavorited an item!" };
  }

  async getNumFavorites(item: ObjectId) {
    const favs = await this.favorites.readMany({ item: item });

    if (favs === null) {
      return { numFavorites: 0 };
    } else {
      return { numFavorites: favs.length };
    }
  }

  async getFavorites(user: ObjectId) {
    const favs = await this.favorites.readMany({ user: user });

    return favs;
  }

  async assertItemIsFavorite(user: ObjectId, item: ObjectId) {
    const favorite = await this.favorites.readOne({ user: user, item: item });

    if (!favorite) {
      throw new FavoriteItemNoMatchError(user, item);
    }
  }

  async assertItemIsNotFavorite(user: ObjectId, item: ObjectId) {
    const favorite = await this.favorites.readOne({ user: user, item: item });

    if (favorite) {
      throw new FavoriteItemExistsError(user, item);
    }
  }
}

export class FavoriteItemNoMatchError extends NotFoundError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super("{0} hasnot favorited item {1}", user, item);
  }
}

export class FavoriteItemExistsError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super("{0} has already favorited item {1}", user, item);
  }
}
