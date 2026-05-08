import express from "express";
import * as auth from "../controllers/authController.js";
import upload from "../helpers/multer.js";

const router = express.Router();

router.get("/register", auth.registerForm);
router.post("/register", upload.single("foto"), auth.register);

router.get("/login", auth.loginForm);
router.post("/login", auth.login);

router.get("/logout", auth.logout);

router.get("/users", auth.getUsersPage);
router.get("/users/count", auth.getUsersCount);
router.get("/users/page", auth.getUsersPageData);

router.get("/profile", auth.getUserProfile);
router.get("/my-profile", auth.getMyProfile);

router.get("/edit-user", auth.getEditUser);
router.post("/edit-user", upload.single("foto"), auth.updateUser);
router.get("/delete-user", auth.deleteUser);

export default router;
