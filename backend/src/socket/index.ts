import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { registerLocationSocket } from "./location.socket.js";

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Socket Connected: ${socket.id}`);

     registerLocationSocket(io, socket);

    socket.on("disconnect", () => {
      console.log(`❌ Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;