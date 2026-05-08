import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    email: String,
    content: String,
    password: String,
    birthDate: String,
    gender: String,
    birthPlace: String,
    residence: String,
    foto: String,
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
