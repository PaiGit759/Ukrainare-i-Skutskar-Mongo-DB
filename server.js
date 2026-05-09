import express from "express";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import expressLayouts from "express-ejs-layouts";

import MongoStore from "connect-mongo";

import authRoutes from "./routes/authRoutes.js";
import forumRoutes from "./routes/forumRoutes.js"; // если есть
import createPath from "./helpers/create-path.js";

dotenv.config();

const app = express();

// =========================
//  MongoDB
// =========================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// =========================
//  EJS + Layouts
// =========================
app.use(expressLayouts);
app.set("layout", "layout");
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// =========================
//  Body parser
// =========================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// =========================
//  Sessions
// =========================

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 30, // 30 days
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);


// =========================
//  Current user in views
// =========================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// =========================
//  Static files
// =========================

app.use(express.static(path.join(process.cwd(), "public"), {
  setHeaders: (res, path) => {
    if (path.endsWith(".svg")) {
      res.setHeader("Content-Type", "image/svg+xml");
    }
  }
}));

// =========================
//  Routes
// =========================
app.use(authRoutes);
app.use("/forum", forumRoutes);

// =========================
//  Pages
// =========================
app.get("/", (req, res) => {
  res.render("index", { title: "Ukrainare från Skutskär" });
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});

// =========================
//  Start server
// =========================
const port = process.env.PORT || 3000;
//const port = 3000;
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
