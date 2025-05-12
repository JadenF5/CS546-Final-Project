import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { ObjectId } from "mongodb";
import { requireLogin } from "../middleware/auth.js";
import { posts } from "../config/mongoCollections.js";
import * as postData from "../data/post.js";
import { users } from "../config/mongoCollections.js";
import { awardAchievement } from "../helpers/achievements.js";
import { notifications } from "../config/mongoCollections.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../public/uploads");

router.get("/posts/new", requireLogin, async (req, res) => {
    const { game, character } = req.query;

    if (!game) {
        return res.status(400).render("error", { title: "Error", error: "Game is required." });
    }

    res.render("newPost", {
        title: "Create New Thread",
        game,
        character: character || null,
        user: req.session.user,
    });
});

router.post("/posts/new", requireLogin, async (req, res) => {
    const { title, body, game, character, tags } = req.body;

    if (!title || !body || !game) {
        return res.status(400).render("error", {
            title: "Error",
            error: "Title, game, and body are required.",
        });
    }

  if(title.length > 300) {
    return res.status(400).render("error", {
            title: "Title Too Big",
            error: "Your post's title is very, very large. Please keep it within 300 characters.",
      });
  }

  if(body.length > 5000) {
    return res.status(400).render("error", {
            title: "Content Too Big",
            error: "Your post is very, very large. Please keep it within 5000 characters.",
      });
  }

  let images = req.files?.images || [];
  let vids   = req.files?.video  ? [req.files.video] : [];
  if (!Array.isArray(images)) images = [images];
  const files = [...images, ...vids];

  if(files.some(f => f && f.truncated)) {
    return res.status(413).render("error", {
      title: "File Too Large",
      error: "One of your uploads on your post exceeded 50 MB. Please pick a smaller file."
    });
  }

  if (images.length && vids.length) {
    return res.status(400).render("error", {
      title: "Error",
      error: "You can upload either up to 3 images or 1 video, not both.",
    });
  }
  if (images.length > 3) {
    return res.status(400).render("error", {
      title: "Error",
      error: "Maximum 3 images allowed.",
    });
  }
  if (vids.length > 1) {
    return res.status(400).render("error", {
      title: "Error",
      error: "Maximum 1 video allowed.",
    });
  }

  for (const img of images) {
    if (!img.mimetype.startsWith("image/")) {
      return res.status(400).render("error", {
        title: "Error",
        error: "All files in the images field must be image types.",
      });
    }
  }
  for (const vid of vids) {
    if (!vid.mimetype.startsWith("video/")) {
      return res.status(400).render("error", {
        title: "Error",
        error: "Files in the video field must be video types.",
      });
    }
  }

  fs.mkdir(uploadDir, { recursive: true }, (mkdirErr) => {
    if (mkdirErr) {
      console.error("Upload directory creation failed:", mkdirErr);
      return res.status(500).render("error", {
        title: "Error",
        error: "Server error preparing file upload.",
      });
    }

    const media = [];
    const allFiles = [
      ...images.map((f) => ({ file: f, type: "image" })),
      ...vids.map((f)   => ({ file: f, type: "video" })),
    ];
    let idx = 0;

    function moveNext() {
      if (idx === allFiles.length) {
        (async () => {
          try {
            const tagList = tags
              ? Array.isArray(tags)
                ? tags
                : tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t)
              : [];

            const postsCollection = await posts();
            const usersCollection = await users();
            const userId           = new ObjectId(req.session.user._id);

            const newPost = {
              userId,
              username: req.session.user.username,
              game,
              character: character || null,
              title,
              body,
              tags: tagList,
              media,
              likes: 0,
              likedBy: [],
              comments: [],
              pinned: false,
              timestamp:  new Date().toISOString(),
            };

            const { insertedId } = await postsCollection.insertOne(newPost);

            if (character){
              const usersToNotify = await usersCollection.find({
                [`favoriteCharacters.${game}`]: character}).toArray();

                const notificationCollection = await notifications();
                const authorId = req.session.user._id.toString();

                for (const user of usersToNotify){
                  if (user._id.toString() === authorId){
                    continue;
                  }

                  await notificationCollection.insertOne({
                    type: "character_post",
                    fromUserId: authorId,
                    toUserId: user._id.toString(),
                    seen: false,
                    timestamp: new Date().toISOString(),
                    message: `${req.session.user.username} posted about ${character} in ${game}.`
                  });
                }

              
            }

            await awardAchievement(userId, "First Post!", usersCollection);
            const userPostCount = await postsCollection.countDocuments({ userId });
            if (userPostCount >= 10) {
              await awardAchievement(userId, "Clip Professional", usersCollection);
            }

            return res.redirect(`/posts/${insertedId.toString()}`);
          } catch (dbErr) {
            console.error("DB error:", dbErr);
            return res.status(500).render("error", {
              title: "Error",
              error: "Failed to save your post.",
            });
          }
        })();
        return;
      }

      const { file, type } = allFiles[idx++];
      const filename = `${Date.now()}-${file.name}`;
      const dest = path.join(uploadDir, filename);

      file.mv(dest, (mvErr) => {
        if (mvErr) {
          console.error("File move error:", mvErr);
          return res.status(500).render("error", {
            title: "Error",
            error: "Could not save uploaded file.",
          });
        }
        media.push({ type, url: `/public/uploads/${filename}` });
        moveNext();
      });
    }
    moveNext();
  });
});

router.get("/posts/:postId", requireLogin, async (req, res) => {
    try {
        const post = await postData.getPostById(req.params.postId);
        post.userId = post.userId.toString();

        if (!post) {
            return res.status(404).render("error", {
                title: "Post Not Found",
                error: "The post you're looking for does not exist.",
            });
        }

        res.render("post", {
            title: post.title,
            post,
            user: req.session.user,
        });
    } catch (e) {
        console.error("❌ Error fetching post:", e);
        res.status(500).render("error", {
            title: "Error",
            error: "Failed to load post.",
        });
    }
});


router.post("/posts/:postId/reply", requireLogin, async (req, res) => {
    try {
        const commentText = req.body.comment?.trim();
        if (!commentText) {
            return res.status(400).render("error", {
                title: "Error",
                error: "Comment cannot be empty.",
            });
        }

        if(commentText.length > 3000) {
          return res.status(400).render("error", {
                title: "Comment Too Big",
                error: "Your comment is very, very large. Please keep it within 3,000 characters.",
          });
        }

        const newComment = {
            _id: new ObjectId().toString(),
            userId: req.session.user._id,
            username: req.session.user.username,
            comment: commentText,
            timestamp: new Date().toISOString(),
        };

        await postData.addCommentToPost(req.params.postId, newComment);
        res.redirect(`/posts/${req.params.postId}`);
    } catch (e) {
        res.status(500).render("error", {
            title: "Error",
            error: "Could not submit reply.",
        });
    }
});

router.post("/posts/:postId/like", requireLogin, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.session.user._id;

        await postData.toggleLike(postId, userId);
        const postsCollection = await posts();
        const usersCollection = await users();

        const userPosts = await postsCollection.find({ userId }).toArray();
        const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

        if (totalLikes >= 50) {
            await awardAchievement(userId, "Famous", usersCollection);
        }

        res.redirect(`/posts/${postId}`);
    } catch (e) {
        res.status(500).render("error", {
            title: "Error",
            error: "Failed to update like status.",
        });
    }
});

// Pin/unpin a thread
router.post("/posts/:postId/pin", requireLogin, async (req, res) => {
    
    if (req.session.user.role !== "admin") {
        return res.status(403).render("error", { title: "Forbidden", error: "Admin access only." });
    }

    const postsCollection = await posts();
    const post = await postsCollection.findOne({ _id: new ObjectId(req.params.postId) });

    if (!post) {
        console.log("❌ Post not found");
        return res.status(404).render("error", { title: "Not Found", error: "Post not found." });
    }

    console.log("✅ Post found:", post);
    
    await postsCollection.updateOne(
        { _id: new ObjectId(req.params.postId) },
        { $set: { pinned: !post.pinned } }
    );

    res.redirect(`/posts/${req.params.postId}`);
});


// Delete a thread if creator or admin
router.post("/posts/:postId/delete", requireLogin, async (req, res) => {
    const userId = req.session.user._id;
    const postsCollection = await posts();
    const post = await postsCollection.findOne({ _id: new ObjectId(req.params.postId) });
    if (!post) {
        return res.status(404).render("error", { title: "Not Found", error: "Post not found." });
    }
    // only author or admin
    if (post.userId.toString() !== userId && req.session.user.role !== "admin") {
        return res.status(403).render("error", { title: "Forbidden", error: "Not allowed" });
    }

    if (Array.isArray(post.media)) {
        post.media.forEach(({ url }) => {
            const filename = path.basename(url);
            const filePath = path.join(uploadDir, filename);
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                console.error('Failed to delete file:', filePath, err);
                }
            });
        });
    }

    await postsCollection.deleteOne({ _id: post._id });
    // redirect back to whichever listing makes sense
    res.redirect(post.character ? `/threads/${post.game}/${post.character}` : `/games/${post.game}`);
});

// Delete a reply if creator or admin
router.post("/posts/:postId/comments/:commentId/delete", requireLogin, async (req, res) => {
  const userId = req.session.user._id;
  const postsCollection = await posts();
  const post = await postsCollection.findOne({ _id: new ObjectId(req.params.postId) });
  if (!post) {
    return res.status(404).render("error", { title: "Not Found", error: "Post not found." });
  }
  // find the comment
  const comment = post.comments.find(c => c._id === req.params.commentId);
  if (!comment) {
    return res.status(404).render("error", { title: "Not Found", error: "Comment not found." });
  }
  // only author or admin
  if (comment.userId !== userId && req.session.user.role !== "admin") {
    return res.status(403).render("error", { title: "Forbidden", error: "Not allowed" });
  }
  await postsCollection.updateOne(
    { _id: post._id },
    { $pull: { comments: { _id: req.params.commentId } } }
  );
  res.redirect(`/posts/${post._id}`);
});


export default router;
