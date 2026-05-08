const express = require("express");
const router = express.Router();
const forum = require("../controllers/forumController");
const upload = require("../helpers/multer");

router.get("/", (req, res) => {
    res.render("forum", {
        title: "Forum",
        user: req.session.user   // ← ВОТ ЭТО ВАЖНО
    });
});


router.get("/add", forum.addForm);
router.post("/add", upload.single("photo"), forum.addPost);

router.get("/count", forum.getCount);
router.get("/page", forum.getPage);

router.get("/post", forum.viewPost);
router.post("/reply", upload.single("photo"), forum.addReply);

module.exports = router;
