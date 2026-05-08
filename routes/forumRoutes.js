import express from "express";
import * as forum from "../controllers/forumController.js";
import upload from "../helpers/multer.js";

import Post from "../models/Post.js";
import Answer from "../models/Answer.js";


const router = express.Router();

// Forum home page
router.get("/", (req, res) => {
    res.render("forum", {
        title: "Forum",
        user: req.session.user
    });
});

// Create a post
router.get("/add", forum.addForm);
router.post("/add", upload.single("foto"), forum.addPost);

// Number of posts
router.get("/count", forum.getCount);

// Pagination
router.get("/page", forum.getPage);

// View post
router.get("/post", forum.viewPost);

// Add a reply
router.post("/reply", upload.single("foto"), forum.addReply);

router.get("/edit", forum.viewEditForm);
router.post("/edit", upload.single("foto"), forum.updatePost);

router.post("/block", forum.blockPost);

router.get("/reply/edit", forum.viewReplyEditForm);
router.post("/reply/edit", upload.single("foto"), forum.updateReply);

router.post("/reply/block", forum.blockReply);

router.get("/post/answers", forum.getAnswersPartial);

router.get("/post/one", forum.getPostPartial);

router.get("/reply/one", forum.getReplyPartial);


router.get("/check-updates", async (req, res) => {
    const count = await Post.countDocuments();
    const lastPost = await Post.findOne().sort({ createdAt: -1 });

    res.json({
        count,
        lastPostId: lastPost?._id,
        lastCreatedAt: lastPost?.createdAt
    });
});



router.get("/check-replies", async (req, res) => {
    const postId = req.query.postId;

    const count = await Answer.countDocuments({ postId });
    const lastReply = await Answer.findOne({ postId }).sort({ createdAt: -1 });

    res.json({
        count,
        lastReplyId: lastReply?._id,
        lastCreatedAt: lastReply?.createdAt
    });
});


export default router;