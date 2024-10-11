import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FeedDoc extends BaseDoc {
  feed: ObjectId;
  item: ObjectId;
}

/**
 * concept: Feeding [Item]
 */
export default class FeedingConcept {
  public readonly feeds: DocCollection<FeedDoc>;

  constructor(collectionName: string) {
    this.feeds = new DocCollection<FeedDoc>(collectionName);
  }

  async addItem(item: ObjectId, feed: ObjectId) {
    await this.assertItemNotInFeed(item, feed);

    await this.feeds.createOne({ feed: feed, item: item });
    return { msg: "An item has been added to a feed!" };
  }

  async deleteItem(item: ObjectId, feed: ObjectId) {
    await this.assertItemInFeed(item, feed);

    await this.feeds.deleteOne({ feed: feed, item: item });
    return { msg: "An item has been deleted from the community!" };
  }

  async getItems(feed: ObjectId) {
    return await this.feeds.readMany({ feed: feed });
  }

  async assertItemInFeed(_id: ObjectId, itemId: ObjectId) {
    const item = await this.feeds.readOne({ community: _id, item: itemId });

    if (!item) {
      throw new FeedItemNoMatchError(itemId, _id);
    }
  }

  async assertItemNotInFeed(_id: ObjectId, itemId: ObjectId) {
    const item = await this.feeds.readOne({ community: _id, item: itemId });

    if (item) {
      throw new FeedItemExistsError(itemId, _id);
    }
  }
}

export class FeedItemNoMatchError extends NotFoundError {
  constructor(
    public readonly item: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not an item of feed {1}", item, _id);
  }
}

export class FeedItemExistsError extends NotAllowedError {
  constructor(
    public readonly item: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is already an item of feed {1}", item, _id);
  }
}
