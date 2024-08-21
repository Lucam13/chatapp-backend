import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import { create } from "domain";

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
      if (userSocketMap) {
        Object.keys(userSocketMap).forEach((userId) => {
          if (userId === senderId._id) return;
          const socketId = userSocketMap[userId];
          if (socketId) {
            io.to(socketId).emit("newMessageFormArea", {
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
