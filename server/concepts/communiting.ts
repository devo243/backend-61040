import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CommunityDoc extends BaseDoc {
  author: ObjectId;
  title: string;
  description: string;
  items: ObjectId[];
  members: ObjectId[];
}

/**
 * concept: Communiting [User, Item]
 */
export default class CommunitingConcept {
  public readonly communities: DocCollection<CommunityDoc>;

  constructor(collectionName: string) {
    this.communities = new DocCollection<CommunityDoc>(collectionName);
  }

  async create(author: ObjectId, title: string, description: string) {
    this.assertCommunityNotExists(title);

    const newItemsArray = <ObjectId[]>[];
    const newMembersArray = <ObjectId[]>[author];
    const _id = await this.communities.createOne({ author, title, description, items: newItemsArray, members: newMembersArray });

    return { msg: "Community Succesfully Created!", community: await this.communities.readOne({ _id }) };
  }

  async delete(_id: ObjectId) {
    await this.communities.deleteOne({ _id });
    return { msg: "Community Succesfully Deleted!" };
  }

  async getCommunityByID(_id: ObjectId) {
    return await this.communities.readOne({ _id });
  }

  async getCommunities() {
    return await this.communities.readMany({}, { sort: { _id: -1 } });
  }

  async getCommunityByTitle(title: string) {
    return await this.communities.readOne({ title });
  }

  async getNumMembers(_id: ObjectId) {
    const community = await this.getCommunityByID(_id);

    if (!community) {
      throw new NotFoundError(`Community ${_id} doesn't exist!`);
    }

    const members = community.members;

    return { numMembers: members.length };
  }

  async join(user: ObjectId, _id: ObjectId) {
    const community = await this.getCommunityByID(_id);

    await this.assertUserNotInCommunity(user, _id);

    const newMembersArray = community?.members;
    newMembersArray?.push(user);

    await this.communities.partialUpdateOne({ _id }, { members: newMembersArray });
    return { msg: "A user has joined the community!" };
  }

  async leave(user: ObjectId, _id: ObjectId) {
    const community = await this.getCommunityByID(_id);

    await this.assertUserInCommunity(user, _id);

    const oldMembersArray = community?.members;
    const newMembersArray = oldMembersArray?.filter((e) => e.toString() !== user.toString());

    await this.communities.partialUpdateOne({ _id }, { members: newMembersArray });
    return { msg: "A user has left the community!" };
  }

  async addItem(item: ObjectId, _id: ObjectId) {
    const community = await this.getCommunityByID(_id);

    await this.assertItemNotInCommunity(item, _id);

    const newItemsArray = community?.items;
    newItemsArray?.push(item);

    await this.communities.partialUpdateOne({ _id }, { items: newItemsArray });
    return { msg: "An item has been added to the community!" };
  }

  async deleteItem(item: ObjectId, _id: ObjectId) {
    const community = await this.getCommunityByID(_id);

    await this.assertItemInCommunity(item, _id);

    const oldItemsArray = community?.items;
    const newItemsArray = oldItemsArray?.filter((e) => e.toString() !== item.toString());

    await this.communities.partialUpdateOne({ _id }, { items: newItemsArray });
    return { msg: "An item has been deleted from the community!" };
  }

  async getItems(_id: ObjectId) {
    const community = await this.getCommunityByID(_id);

    return community?.items;
  }

  checkObjectIdInArray(_id: ObjectId, arr: ObjectId[]) {
    for (const id of arr) {
      if (_id.equals(id)) {
        return true;
      }
    }

    return false;
  }

  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const community = await this.getCommunityByID(_id);

    if (!community) {
      throw new NotFoundError(`Community ${_id} doesn't exist!`);
    }

    if (community.author.toString() !== user.toString()) {
      throw new CommunityAuthorNoMatchError(user, _id);
    }
  }

  async assertUserInCommunity(_id: ObjectId, user: ObjectId) {
    const community = await this.getCommunityByID(_id);

    if (!community) {
      throw new NotFoundError(`Community ${_id} doesn't exist!`);
    }

    const members = community.members;

    if (!this.checkObjectIdInArray(user, members)) {
      throw new CommunityUserNoMatchError(user, _id);
    }
  }

  async assertUserNotInCommunity(_id: ObjectId, user: ObjectId) {
    const community = await this.getCommunityByID(_id);

    if (!community) {
      throw new NotFoundError(`Community ${_id} doesn't exist!`);
    }

    const members = community.members;

    if (this.checkObjectIdInArray(user, members)) {
      throw new CommunityUserNoMatchError(user, _id);
    }
  }

  async assertItemInCommunity(_id: ObjectId, item: ObjectId) {
    const community = await this.getCommunityByID(_id);

    if (!community) {
      throw new NotFoundError(`Community ${_id} doesn't exist!`);
    }

    const items = community.items;

    if (!this.checkObjectIdInArray(item, items)) {
      throw new CommunityUserNoMatchError(item, _id);
    }
  }

  async assertItemNotInCommunity(_id: ObjectId, item: ObjectId) {
    const community = await this.getCommunityByID(_id);

    if (!community) {
      throw new NotFoundError(`Community ${_id} doesn't exist!`);
    }

    const items = community.items;

    if (this.checkObjectIdInArray(item, items)) {
      throw new CommunityUserNoMatchError(item, _id);
    }
  }

  async assertCommunityNotExists(title: string) {
    const community = await this.getCommunityByTitle(title);

    if (community) {
      throw new NotAllowedError("Community already exists");
    }
  }
}

export class CommunityAuthorNoMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of community {1}", author, _id);
  }
}

export class CommunityUserNoMatchError extends NotFoundError {
  constructor(
    public readonly member: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not a member of community {1}", member, _id);
  }
}

export class CommunityMemberExistsError extends NotAllowedError {
  constructor(
    public readonly member: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is already a member of community {1}", member, _id);
  }
}

export class CommunityItemNoMatchError extends NotFoundError {
  constructor(
    public readonly item: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not an item of community {1}", item, _id);
  }
}

export class CommunityItemExistsError extends NotAllowedError {
  constructor(
    public readonly item: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is already an item of community {1}", item, _id);
  }
}
