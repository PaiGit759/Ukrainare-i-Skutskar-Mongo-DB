import Post from "../models/Post.js";
import Answer from "../models/Answer.js";
import uploadToR2 from "../helpers/uploadR2.js";
import deleteFromR2 from "../helpers/deleteR2.js";
import createPath from "../helpers/create-path.js";

// Post addition form
export const addForm = (req, res) => {
    res.render("add-forum", {
        title: "Add Post",
        user: req.session.user
    });
};

//Adding a post

export const addPost = async (req, res) => {
    try {
        let photoUrl = null;

        if (req.file) {
            const fileName = `${Date.now()}_${req.file.originalname}`;
            photoUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);
        }

        const post = new Post({
            userId: req.session.user.id,
            title: req.body.title,
            content: req.body.content,
            photo: photoUrl,
            isPinned: req.body.isPinned === "on",
            lastReplyAt: Date.now()
        });


        await post.save();

        res.redirect(`/forum/post?id=${post._id}`);
    } catch (err) {
        console.error(err);
        res.send("Error creating post");
    }
};

//Number of posts
export const getCount = async (req, res) => {
    const count = await Post.countDocuments();
    res.json({ count });
};

//Pagination

export const getPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const posts = await Post.find()
        .sort({ isPinned: -1, lastReplyAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name foto")
        .lean();

    // we count the number of responses
    for (let post of posts) {
        post.replyCount = await Answer.countDocuments({ postId: post._id });
    }

    res.json(posts.map(p => ({
        id: p._id,
        content: p.content,
        createdAt: p.createdAt,
        lastReplyAt: p.lastReplyAt,
        replyCount: p.replyCount,
        userId: p.userId?._id || null,
        userName: p.userId?.name || "Unknown",
        userFoto: p.userId?.foto || "/image/UndefinedUser.jpg",
        isBlocked: p.isBlocked,
        blockedMessage: p.blockedMessage
    })));
};

// View post
export const viewPost = async (req, res) => {
    const id = req.query.id;

    // --- MAIN POST ---
    const post = await Post.findById(id)
        .populate("userId", "name foto")
        .lean();

    // --- ANSWERS ---
    const answers = await Answer.find({ postId: id })
        .sort({ createdAt: 1 })
        .populate("userId", "name foto")
        .lean();

    const replyCount = answers.length;
    const lastReplyAt = replyCount > 0 ? answers[replyCount - 1].createdAt : null;

    // Add user info to post
    post.userName = post.userId?.name || "Unknown";
    post.userFoto = post.userId?.foto || "/image/UndefinedUser.jpg";
    post.lastReplyAt = lastReplyAt;

    // Add user info to answers
    const formattedAnswers = answers.map(a => ({
        ...a,
        userName: a.userId?.name || "Unknown",
        userFoto: a.userId?.foto || "/image/UndefinedUser.jpg"
    }));


    // ---------------------------------------------------------
    //  BUILDING replyLinks: Who responded to whom?
    // ---------------------------------------------------------

    // replyLinks = { 0: [3,5], 1: [4], 2: [], ... }
    const replyLinks = {};

    // Main post = 0
    replyLinks[0] = [];

    // Initialize all answers
    formattedAnswers.forEach((a, index) => {
        const num = index + 1;
        replyLinks[num] = [];
    });

    // Parse each answer for references like (5)
    formattedAnswers.forEach((a, index) => {
        const fromNum = index + 1;

        const matches = a.content.match(/\((\d+)\)/g);

        if (matches) {
            matches.forEach(m => {
                const target = parseInt(m.replace(/\(|\)/g, ""), 10);

                if (!replyLinks[target]) replyLinks[target] = [];
                replyLinks[target].push(fromNum);
            });
        }
    });

    // ---------------------------------------------------------

    res.render("post", {
        title: post.title,
        post,
        answers: formattedAnswers,
        replyCount,
        replyLinks,
        user: req.session.user
    });
};


// Adding a response

export const addReply = async (req, res) => {
    try {
        const { postId, content } = req.body;

        let photoUrl = null;

        if (req.file) {
            const fileName = `${Date.now()}_${req.file.originalname}`;
            photoUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);
        }

        // 1. Create a response
        const reply = new Answer({
            postId,
            userId: req.session.user.id,
            content,
            photo: photoUrl
        });

        await reply.save();

        // 2. Updating the last reply date
        await Post.findByIdAndUpdate(postId, {
            lastReplyAt: reply.createdAt
        });

        // 3. We receive the number of the new response
        const replyCount = await Answer.countDocuments({ postId });

        // 4. Redirect with response number
        res.redirect(`/forum/post?id=${postId}&newReply=${replyCount}`);

    } catch (err) {
        console.error(err);
        res.send("Error creating reply");
    }
};

export const viewEditForm = async (req, res) => {
    const id = req.query.id;

    const post = await Post.findById(id).lean();

    if (!post) return res.send("Post not found");

    // Check rights
    if (req.session.user.role !== "admin" &&
        req.session.user.id !== post.userId.toString()) {
        return res.send("Access denied");
    }

    res.render("edit-forum", {
        title: "Edit post",
        post,
        user: req.session.user
    });
};

export const updatePost = async (req, res) => {
    try {
        const { id, content, isPinned } = req.body;

        const post = await Post.findById(id);

        if (!post) return res.send("Post not found");

        // Check rights
        if (req.session.user.role !== "admin" &&
            req.session.user.id !== post.userId.toString()) {
            return res.send("Access denied");
        }

        let photoUrl = post.photo;

        if (req.file) {
            const fileName = `${Date.now()}_${req.file.originalname}`;
            photoUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);
        }

        post.content = content;
        post.photo = photoUrl;

        if (req.session.user.role === "admin") {
            post.isPinned = isPinned === "on";
        }

        await post.save();

        res.redirect(`/forum/post?id=${id}`);

    } catch (err) {
        console.error(err);
        res.send("Error updating post");
    }
};


export async function blockPost(req, res) {
    try {
        if (!req.session.user || req.session.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const postId = req.query.id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        post.isBlocked = !post.isBlocked;
        post.blockedMessage = post.isBlocked
            ? "The content of the post has been removed by the administrator."
            : null;

        await post.save();

        return res.json({
            success: true,
            isBlocked: post.isBlocked
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
}



//*********

export async function viewReplyEditForm(req, res) {
    try {
        const replyId = req.query.id;
        const reply = await Answer.findById(replyId).populate("userId");

        if (!reply) return res.status(404).send("Reply not found");

        // Проверка прав
        if (
            !req.session.user ||
            (
                req.session.user.role !== "admin" &&
                req.session.user.id !== reply.userId._id.toString()
            )
        ) {
            return res.status(403).send("Access denied");
        }

        res.render("reply-edit", {
            title: "Edit reply",
            reply,
            user: req.session.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
}


export async function updateReply(req, res) {
    try {
        const replyId = req.body.id;
        const postId = req.body.postId;

        const updateData = {
            content: req.body.content
        };

        if (req.file) {
            const fileName = `${Date.now()}_${req.file.originalname}`;
            const photoUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);
            updateData.photo = photoUrl;
        }

        await Answer.findByIdAndUpdate(replyId, updateData);

        // --- ВОССТАНАВЛИВАЕМ ВОЗВРАТ К ОТВЕТУ ---
        const answers = await Answer.find({ postId }).sort({ createdAt: 1 }).lean();
        const replyNum = answers.findIndex(a => a._id.toString() === replyId) + 1;

        res.redirect(`/forum/post?id=${postId}&newReply=${replyNum}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
}


export async function blockReply(req, res) {
    try {
        if (!req.session.user || req.session.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const replyId = req.query.id;
        const reply = await Answer.findById(replyId);

        if (!reply) {
            return res.status(404).json({ error: "Reply not found" });
        }

        reply.isBlocked = !reply.isBlocked;
        reply.blockedMessage = reply.isBlocked
            ? "The answer was removed by the administrator."
            : null;

        await reply.save();

        return res.json({
            success: true,
            isBlocked: reply.isBlocked
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
}


export async function getPostPartial(req, res) {
    try {
        const postId = req.query.id;

        const post = await Post.findById(postId).populate("userId");
        const answers = await Answer.find({ postId }).populate("userId");

        // If buildReplyLinks is not present, temporarily disable it.
        let replyLinks = {};
        if (typeof buildReplyLinks === "function") {
            replyLinks = buildReplyLinks(answers);
        }

        return res.render("partials/post", {
            post,
            user: req.session.user,
            replyLinks,
            replyCount: answers.length
        });

    } catch (err) {
        console.error("getPostPartial ERROR:", err);
        return res.status(500).send("Server error");
    }
}

export async function getAnswersPartial(req, res) {
    try {
        const postId = req.query.id;

        const answers = await Answer.find({ postId })
            .sort({ createdAt: 1 })
            .populate("userId", "name foto")
            .lean();

        const formattedAnswers = answers.map((a, index) => ({
            ...a,
            num: index + 1,
            userName: a.userId?.name || "Unknown",
            userFoto: a.userId?.foto || "/image/UndefinedUser.jpg"
        }));

        return res.render("partials/answers", {
            answers: formattedAnswers,
            user: req.session.user
        });

    } catch (err) {
        console.error("getAnswersPartial ERROR:", err);
        return res.status(500).send("Server error");
    }
}

export async function getReplyPartial(req, res) {
    try {
        const replyId = req.query.id;

        const reply = await Answer.findById(replyId)
            .populate("userId", "name foto")
            .lean();

        if (!reply) return res.status(404).send("Reply not found");

        reply.userName = reply.userId?.name || "Unknown";
        reply.userFoto = reply.userId?.foto || "/image/UndefinedUser.jpg";

        return res.render("partials/reply", {
            reply,
            user: req.session.user
        });

    } catch (err) {
        console.error("getReplyPartial ERROR:", err);
        return res.status(500).send("Server error");
    }
}
