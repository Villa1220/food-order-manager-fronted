import { io as createSocket, type Socket } from "socket.io-client";
import { API_URL } from "./auth";

let socket: Socket | null = null;

/** Socket singleton hacia el backend (sala kitchen para el KDS). */
export function getSocket(): Socket {
  if (!socket) {
    socket = createSocket(API_URL, {
      transports: ["websocket"],
    });
  }
  return socket;
}
