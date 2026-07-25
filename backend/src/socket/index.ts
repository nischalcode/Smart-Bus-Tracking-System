import { Server } from "socket.io";
import http from "http";
import { registerLocationSocket } from "./location.socket.js";

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    registerLocationSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export const getIO = () => io;