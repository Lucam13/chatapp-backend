import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL],
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; // {userId: socketId}
const areaUserMap = {}; // {areaId: [userId1, userId2, ...]}

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  // console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  const areaId =
    socket.handshake.query.areaId === "undefined"
      ? "lobby"
      : socket.handshake.query.areaId;

  if (userId && areaId) {
    userSocketMap[userId] = socket.id;

    if (!areaUserMap[areaId]) {
      areaUserMap[areaId] = [];
    }
    if (!areaUserMap[areaId].includes(userId)) {
      areaUserMap[areaId].push(userId);
    }

    // console.log("User socket map:", userSocketMap);
    // console.log("Area user map:", areaUserMap);

    // Emitir los usuarios conectados en la misma área
    areaUserMap[areaId].forEach((id) => {
      const userSocketId = userSocketMap[id];
      if (userSocketId) {
        io.to(userSocketId).emit("getOnlineUsersInArea", areaUserMap);
      }
    });
  }

  socket.on(
    "sendMessageToArea",
    ({ message, areaId, senderId, receiverId }) => {
      if (areaUserMap[areaId]) {
        areaUserMap[areaId]
          // Enviamos el mensaje a todos los usuarios en el área excepto al remitente
          .filter((id) => id !== senderId._id)
          .forEach((userId) => {
            const receiverSocketId = userSocketMap[userId];
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("newMessageFromArea", {
                message,
                areaId,
                senderId,
                receiverId,
                createdAt: new Date(),
              });
            }
          });
      }
    }
  );

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    // Remove the user from the userSocketMap and areaUserMap
    delete userSocketMap[userId];
    if (areaId && areaUserMap[areaId]) {
      areaUserMap[areaId] = areaUserMap[areaId].filter((id) => id !== userId);
      if (areaUserMap[areaId].length === 0) {
        delete areaUserMap[areaId];
      }
    }

    // console.log("Updated user socket map:", userSocketMap);
    // console.log("Updated area user map:", areaUserMap);

    // Emit updated list of online users in the area
    if (areaId && areaUserMap[areaId]) {
      areaUserMap[areaId].forEach((id) => {
        const userSocketId = userSocketMap[id];
        if (userSocketId) {
          io.to(userSocketId).emit("getOnlineUsersInArea", areaUserMap);
        }
      });
    }
  });
});

export { app, io, server };
