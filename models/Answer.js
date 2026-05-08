import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: String,
    photo: String,
    createdAt: { type: Date, default: Date.now },
    isBlocked: Boolean,
    blockedMessage: String
});

export default mongoose.model("Answer", AnswerSchema);
