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

		const conversation = await Conversation.findOne({
			// Find the conversation between these areas
			areas: { $all: [senderAreaId, receiverAreaId] },
		})
			.exec()
			.then((conversation) => {
				if (!conversation?.messages) {
					return conversation;
				} else {
					// Populate the messages in the conversation
					return conversation.populate({
						path: "messages",
						populate: {
							path: "senderId",
							model: "User",
							select: "fullName profilePic",
						},
					});
				}
			});

		if (!conversation) {
			return res.status(200).json([]);
		}

		const messages = conversation.messages.filter(
			(msg) => msg.receiverId.toString() === receiverAreaId
		);

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
