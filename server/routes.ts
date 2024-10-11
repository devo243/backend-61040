import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Communiting, Favoriting, Featuring, Feeding, Friending, Posting, Sessioning } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  // Communiting

  @Router.post("/communities")
  async createCommunity(session: SessionDoc, title: string, description: string) {
    const user = Sessioning.getUser(session);
    const created = await Communiting.create(user, title, description);
    return { msg: created.msg, community: await Responses.community(created.community) };
  }

  @Router.get("/communities")
  async getCommunities(title?: string) {
    if (title) {
      const community = await Communiting.getCommunityByTitle(title);
      return Responses.community(community);
    } else {
      const communities = await Communiting.getCommunities();

      return Responses.communities(communities);
    }
  }

  @Router.delete("/communities/:id")
  async deleteCommunity(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Communiting.assertAuthorIsUser(oid, user);
    await Feeding.deleteFeed(oid);
    return await Communiting.delete(oid);
  }

  @Router.patch("/communities/:id/join")
  async joinCommunity(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    return await Communiting.join(user, oid);
  }

  @Router.patch("/communities/:id/leave")
  async leaveCommunity(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    return await Communiting.leave(user, oid);
  }

  @Router.get("/communities/:id/items")
  async getCommunityItems(id: string) {
    const oid = new ObjectId(id);

    await Communiting.assertCommunityExists(oid);

    return await Feeding.getItems(oid);
  }

  @Router.post("/communities/:id/items/")
  async addCommunityItem(id: string, itemID: string) {
    const communityObjectID = new ObjectId(id);
    const itemObjectID = new ObjectId(itemID);

    await Communiting.assertCommunityExists(communityObjectID);

    return await Feeding.addItem(itemObjectID, communityObjectID);
  }

  @Router.delete("/communities/:id/items/:itemID")
  async deleteCommunityItem(id: string, itemID: string) {
    const communityObjectID = new ObjectId(id);
    const itemObjectID = new ObjectId(itemID);

    await Communiting.assertCommunityExists(communityObjectID);

    return await Feeding.deleteItem(itemObjectID, communityObjectID);
  }

  // Favoriting
  @Router.post("/posts/:id/favorites")
  async favoriteItem(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);

    return await Favoriting.favorite(user, oid);
  }

  @Router.delete("/posts/:id/favorites")
  async unfavoriteItem(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);

    return await Favoriting.unfavorite(user, oid);
  }

  @Router.get("/posts/:id/favorites/")
  async getNumFavorites(id: string) {
    const oid = new ObjectId(id);

    return await Favoriting.getNumFavorites(oid);
  }

  @Router.get("/users/:username/favorites")
  async getFavorites(username: string) {
    const oid = (await Authing.getUserByUsername(username))._id;

    return await Favoriting.getFavorites(oid);
  }

  // Featuring
  @Router.get("/posts/featured")
  async getFeatured() {
    return await Featuring.getFeatured();
  }

  @Router.post("/posts/featured")
  async addFeatured(item: string, attention: string) {
    const itemID = new ObjectId(item);

    return await Featuring.promote(itemID, +attention);
  }

  @Router.delete("/posts/featured/:item")
  async deleteFeatured(item: string, attention: string) {
    const itemID = new ObjectId(item);

    return await Featuring.depromote(itemID, +attention);
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
