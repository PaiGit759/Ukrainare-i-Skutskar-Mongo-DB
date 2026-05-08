import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",              // <-- ЭТО ОБЯЗАТЕЛЬНО
        required: true
    },
    title: String,
    content: String,
    photo: String,

    // 🔥 Новые поля
    isPinned: { type: Boolean, default: false },
    lastReplyAt: { type: Date, default: Date.now },

    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedMessage: {
        type: String,
        default: ""
    },


    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Post", PostSchema);