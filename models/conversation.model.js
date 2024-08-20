import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    areas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Area",
        required: true,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
