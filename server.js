import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import areaRoutes from "./routes/area.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// cors
app.use(
  cors({
    origin: FRONTEND_URL,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/areas", areaRoutes);

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server Running on port ${PORT}`);
});
