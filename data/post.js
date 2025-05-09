import { ObjectId } from "mongodb";
import { posts } from "../config/mongoCollections.js";

export const getPostById = async (postId) => {

    if (!ObjectId.isValid(postId)) {
        console.log("❌ Invalid ObjectId");
        throw "Invalid post ID";
    }

    const postsCollection = await posts();
    const result = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!result) console.log("⚠️ Post not found in DB");
    return result;
};


export const addCommentToPost = async (postId, commentObj) => {
    if (!ObjectId.isValid(postId)) throw "Invalid post ID";

    const postsCollection = await posts();
    const result = await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $push: { comments: commentObj } }
    );

    if (result.modifiedCount === 0) throw "Failed to add comment.";
    return true;
};

export const toggleLike = async (postId, userId) => {
    if (!ObjectId.isValid(postId)) throw "Invalid post ID";

    const postsCollection = await posts();
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) throw "Post not found";

    const hasLiked = post.likedBy?.includes(userId);

    const update = hasLiked
        ? {
              $inc: { likes: -1 },
              $pull: { likedBy: userId }
          }
        : {
              $inc: { likes: 1 },
              $addToSet: { likedBy: userId }
          };

    const result = await postsCollection.updateOne({ _id: new ObjectId(postId) }, update);
    if (result.modifiedCount === 0) throw "Failed to update likes";

    return !hasLiked; // true if now liked, false if unliked
};

