import { Authing } from "./app";
import { CommunityAuthorNoMatchError, CommunityDoc, CommunityMemberExistsError, CommunityUserNoMatchError } from "./concepts/communiting";
import { FavoriteItemExistsError, FavoriteItemNoMatchError } from "./concepts/favoriting";
import { FeedItemExistsError, FeedItemNoMatchError } from "./concepts/feeding";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friending";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/posting";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await Authing.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await Authing.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await Authing.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }

  static async community(community: CommunityDoc | null) {
    if (!community) {
      return community;
    }

    const author = await Authing.getUserById(community.author);
    return { ...community, author: author.username };
  }

  static async communities(communities: CommunityDoc[]) {
    const authors = await Authing.idsToUsernames(communities.map((community) => community.author));
    return communities.map((community, i) => ({ ...community, author: authors[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(CommunityAuthorNoMatchError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(CommunityUserNoMatchError, async (e) => {
  const username = (await Authing.getUserById(e.member)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(CommunityMemberExistsError, async (e) => {
  const username = (await Authing.getUserById(e.member)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FeedItemExistsError, async (e) => {
  return e.formatWith(e.item, e._id);
});

Router.registerError(FeedItemNoMatchError, async (e) => {
  return e.formatWith(e.item, e._id);
});

Router.registerError(FavoriteItemNoMatchError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(username, e.item);
});

Router.registerError(FavoriteItemExistsError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(username, e.item);
});
