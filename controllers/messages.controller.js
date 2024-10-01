import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverAreaId } = req.params; // Área receptora
    const senderUserId = req.user._id; // ID del usuario remitente
    const senderAreaId = req.user.area._id; // Área del remitente

    // Encuentra todas las conversaciones (esto sigue siendo costoso)
    let conversations = await Conversation.find();

    // Filtra las conversaciones que contienen ambas áreas (sin importar el orden)
    let filteredConversations = conversations.filter((conversation) => {
      const areas = conversation.areas.map((area) => area.toString());
      return (
        areas.includes(senderAreaId.toString()) &&
        areas.includes(receiverAreaId.toString())
      );
    });

    // Escoger la primera conversación filtrada (si existe)
    let conversation = filteredConversations[0];

    // Si no existe conversación, crea una nueva
    if (!conversation) {
      conversation = await Conversation.create({
        areas: [senderAreaId, receiverAreaId],
      });
    }

    // Crea el nuevo mensaje con senderId como el userId
    const newMessage = new Message({
      senderId: senderUserId, // Usuario que envía el mensaje
      receiverId: receiverAreaId, // Área que recibe el mensaje
      message,
    });

    // Si el mensaje se creó, lo agregamos a la conversación
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // Guarda la conversación y el mensaje nuevo
    await Promise.all([conversation.save(), newMessage.save()]);

    // Funcionalidad de Socket.io para notificar al receptor
    const receiverSocketId = getReceiverSocketId(receiverAreaId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error en sendMessage controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const getMessages = async (req, res) => {
  try {
    const { id: receiverAreaId } = req.params; // Area ID
    const senderAreaId = req.user.area._id; // Area ID of the sender's area

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

    const conversations = conversation.filter((conversation) => {
      if (conversation.areas[1].toString() === receiverAreaId) {
        console.log("MESSAGE RECEIVER ID: ", conversation._id);
      }
      return conversation.areas[1].toString() === receiverAreaId;
    });
    let messages = [];
    for (const conversation of conversations) {
      messages = messages.concat(conversation.messages);
    }

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
