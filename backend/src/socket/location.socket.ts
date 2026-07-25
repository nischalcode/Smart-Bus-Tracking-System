import { Server, Socket } from "socket.io";

// Location updates go through HTTP POST /track only.
// Socket is used by TrackingSimulator to broadcast tracking-update events.
export const registerLocationSocket = (
  _io: Server,
  _socket: Socket
) => {
  // Intentionally empty — all location logic is in TrackingController
};