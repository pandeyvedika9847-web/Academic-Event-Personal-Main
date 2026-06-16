import { io } from "socket.io-client";
import { PUBLIC_CONFIG } from "@/lib/config/public";

export const socket = io(PUBLIC_CONFIG.socketUrl, {
  autoConnect: false,
  withCredentials: true,
});
