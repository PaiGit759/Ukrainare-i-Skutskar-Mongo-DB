import express from "express";
import * as forum from "../controllers/forumController.js";
import upload from "../helpers/multer.js";


const router = express.Router();


// Forum home page
router.get("/", (req, res) => {
    res.render("forum", {
        title: "Forum",
        user: req.session.user
    });
});

// Создать пост
router.get("/add", forum.addForm);
//router.post("/add", upload.single("photo"), forum.addPost);
router.post("/add", upload.single("foto"), forum.addPost);

// Количество постов
router.get("/count", forum.getCount);

// Пагинация
router.get("/page", forum.getPage);

// Просмотр поста
router.get("/post", forum.viewPost);

// Добавить ответ
//router.post("/reply", upload.single("photo"), forum.addReply);
router.post("/reply", upload.single("foto"), forum.addReply);

router.get("/edit", forum.viewEditForm);
router.post("/edit", upload.single("foto"), forum.updatePost);

router.post("/block", forum.blockPost);

router.get("/reply/edit", forum.viewReplyEditForm);
router.post("/reply/edit", upload.single("foto"), forum.updateReply);

router.post("/reply/block", forum.blockReply);

router.get("/post/answers", forum.getAnswersPartial);

//res.render("partials/post", { post, user, replyLinks });

router.get("/post/one", forum.getPostPartial);

router.get("/reply/one", forum.getReplyPartial);



export default router;