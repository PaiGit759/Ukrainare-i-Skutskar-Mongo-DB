import bcrypt from "bcrypt";
import User from "../models/User.js";
import uploadToR2 from "../helpers/uploadR2.js";
import deleteFromR2 from "../helpers/deleteR2.js";
import createPath from "../helpers/create-path.js";

export const registerForm = (req, res) => {
    res.render("register", { title: "Register", message: "" });
};

export const loginForm = (req, res) => {
    res.render("login", { title: "Login", message: "" });
};

// REGISTER
export const register = async (req, res) => {
    try {
        const {
            name, firstName, lastName, email, content, password,
            birthDate, gender, birthPlace, residence
        } = req.body;


        if (!name || !password) {
            return res.render(createPath("register"), {
                title: "Register",
                message: "Username and password are required"
            });
        }

        // Checking the existence of a user
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.render(createPath("register"), {
                title: "Register",
                message: "This username is already taken"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        let fotoUrl = null;
        if (req.file) {
            const fileName = `${Date.now()}_${req.file.originalname}`;
            fotoUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);
        }

        const newUser = new User({
            name,
            firstName,
            lastName,
            birthDate,
            gender,
            birthPlace,
            residence,
            email,
            content,
            password: hashedPassword,
            foto: fotoUrl
        });

        await newUser.save();

        req.session.user = {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            foto: newUser.foto
        };


        res.redirect(`/profile?id=${newUser._id}`);
    } catch (error) {
        console.error(error);
        res.render(createPath("register"), {
            title: "Register",
            message: "Registration error"
        });
    }
};

// LOGIN
export const login = async (req, res) => {
    const { user, password } = req.body;

    try {
        const foundUser = await User.findOne({ name: user });

        if (!foundUser) {
            return res.render("login", { title: "Login", message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, foundUser.password);
        if (!isMatch) {
            return res.render("login", { title: "Login", message: "Wrong password" });
        }

        req.session.user = {
            id: foundUser._id.toString(),
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            foto: foundUser.foto
        };

        res.redirect(`/profile?id=${foundUser._id}`);
    } catch (err) {
        console.error("Login error:", err);
        res.render("login", { title: "Login", message: "Server error" });
    }
};

export const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};

// USERS PAGE
export const getUsersPage = (req, res) => {
    res.render(createPath("users"), { title: "Users" });
};

// USERS COUNT
export const getUsersCount = async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to count users" });
    }
};

// USERS PAGE DATA
export const getUsersPageData = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 18;

        const users = await User.find()
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load users page" });
    }
};

// MY PROFILE
export const getMyProfile = async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const user = await User.findById(req.session.user.id);

    res.render("profile", {
        profileUser: user,
        currentUser: req.session.user || null
    });

};

// ANY USER PROFILE
export const getUserProfile = async (req, res) => {
    const userId = req.query.id;

    const user = await User.findById(userId);

    if (!user) return res.send("User not found");

    res.render("profile", {
        profileUser: user,
        currentUser: req.session.user || null
    });
};

// EDIT USER PAGE

export const getEditUser = async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const id = req.query.id;
    const user = await User.findById(id);

    if (!user) return res.send("User not found");

    res.render("edit-user", {
        profileUser: user,
        currentUser: req.session.user
    });
};

// UPDATE USER
export const updateUser = async (req, res) => {
    const id = req.body.id;

    const oldUser = await User.findById(id);
    if (!oldUser) return res.send("User not found");

    let fotoUrl = oldUser.foto;

    if (req.file) {
        if (oldUser.foto) await deleteFromR2(oldUser.foto);

        const fileName = `${Date.now()}_${req.file.originalname}`;
        fotoUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);
    }

    const updatedUser = await User.findByIdAndUpdate(
        id,
        {
            ...req.body,
            foto: fotoUrl
        },
        { new: true }
    );

    // WE UPDATE THE SESSION ONLY IF IT EXISTS AND IT IS THE CURRENT USER
    if (req.session && req.session.user && req.session.user.id === id) {
        req.session.user = {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            foto: updatedUser.foto
        };
    }

    res.redirect(`/profile?id=${id}`);
};

// DELETE USER
export const deleteUser = async (req, res) => {
    const id = req.query.id;

    const user = await User.findById(id);
    if (!user) return res.send("User not found");

    if (user.foto) await deleteFromR2(user.foto);

    await User.findByIdAndDelete(id);

    // If we delete OURSELVES, we log out of the system
    if (req.session.user && req.session.user.id === id) {
        req.session.destroy(() => res.redirect("/login"));
        return;
    }

    res.redirect("/users");
};

