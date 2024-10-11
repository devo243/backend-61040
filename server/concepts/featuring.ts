import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FeaturingDoc extends BaseDoc {
  item: ObjectId;
}

/**
 * concept: Featuring [Item, Number]
 */
export default class FeaturingConcept {
  public readonly features: DocCollection<FeaturingDoc>;
  public readonly minimumAttention: number;

  constructor(collectionName: string, minimumAttention: number) {
    this.features = new DocCollection<FeaturingDoc>(collectionName);
    this.minimumAttention = minimumAttention;
  }

  async promote(item: ObjectId, attention: number) {
    this.assertItemIsNotFeatured(item);

    if (attention >= this.minimumAttention) {
      await this.features.createOne({ item: item });
      return { msg: "An item has been added to a feed!" };
    } else {
      return { msg: "The item didn't meet the minimum attention." };
    }
  }

  async depromote(item: ObjectId, attention: number) {
    this.assertItemIsFeatured(item);

    if (attention < this.minimumAttention) {
      await this.features.deleteOne({ item: item });
      return { msg: "An item has been depromoted" };
    } else {
      return { msg: "The item still has the minimum attention." };
    }
  }

  async getFeatured() {
    return await this.features.readMany({}, { sort: { _id: -1 } });
  }

  async assertItemIsFeatured(item: ObjectId) {
    const feature = this.features.readOne({ item: item });

    if (!item) {
      throw new NotFoundError("Item is not featured!");
    }
  }

  async assertItemIsNotFeatured(item: ObjectId) {
    const feature = this.features.readOne({ item: item });

    if (item) {
      throw new NotAllowedError("Item is already featured!");
    }
  }
}
