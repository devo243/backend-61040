import AuthenticatingConcept from "./concepts/authenticating";
import CommunitingConcept from "./concepts/communiting";
import FavoritingConcept from "./concepts/favoriting";
import FeedingConcept from "./concepts/feeding";
import FriendingConcept from "./concepts/friending";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Communiting = new CommunitingConcept("communities");
export const Favoriting = new FavoritingConcept("favorites");
export const Feeding = new FeedingConcept("feeds");
