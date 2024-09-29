import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverAreaId } = req.params; // Area ID
    const senderUserId = req.user._id; // User ID of the sender
    const senderAreaId = req.user.area._id; // Area ID of the sender's area

    // Find or create a conversation between these areas
    let conversation = await Conversation.findOne({
      areas: { $all: [senderAreaId, receiverAreaId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        areas: [senderAreaId, receiverAreaId],
      });
    }

    // Create the new message with senderId as the userId
    const newMessage = new Message({
      senderId: senderUserId, // User who sends the message
      receiverId: receiverAreaId, // The area that receives the message
      message,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // Save the conversation and the new message
    await Promise.all([conversation.save(), newMessage.save()]);

    // Socket.io functionality to notify the receiver
    const receiverSocketId = getReceiverSocketId(receiverAreaId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: receiverAreaId } = req.params; // Area ID
    const senderAreaId = req.user.area._id; // Area ID of the sender's area
    console.log("SENDER", senderAreaId, "RECEIVER", receiverAreaId);
    const conversation = await Conversation.find({
      // Find the conversation between these areas

      areas: { $all: [receiverAreaId] },
    })
      .populate({
        path: "messages",
        populate: {
          path: "senderId",
          model: "User",
          select: "fullName profilePic",
        },
      })
      .exec()
      .then((conversation) => {
        return conversation;
      });

    if (!conversation) {
      return res.status(200).json([]);
    }

    console.log(conversation, "ACAAAAA");

    console.log(conversation.length);
    const conversations = conversation.filter(
      (conversation) => conversation.areas[1].toString() === receiverAreaId
    );
    let messages = [];
    for (const conversation of conversations) {
      messages = messages.concat(conversation.messages);
    }

    console.log(messages.length);
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
