import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentBranchId: string | null = null;

export function getSocket(): Socket {
  if (!socket) {
    let socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:8002";

    // Auto-detect and adapt URL in the browser
    if (typeof window !== "undefined") {
      // 1. Avoid Mixed Content on HTTPS pages
      if (window.location.protocol === "https:" && socketUrl.startsWith("http://")) {
        socketUrl = socketUrl.replace(/^http:\/\//, "https://");
      }
      // 2. If opened from another device/LAN IP (e.g. tablet, phone), replace localhost with current host
      if (
        socketUrl.includes("localhost") &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        socketUrl = socketUrl.replace("localhost", window.location.hostname);
      }
    }

    socket = io(socketUrl, {
      transports: ["polling", "websocket"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to server:", socket?.id);
      if (currentBranchId) {
        console.log("[Socket.io] Re-joining branch room:", currentBranchId);
        socket?.emit("join_branch", { branchId: currentBranchId });
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn("[Socket.io] Disconnected from server:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error(`[Socket.io] Connection error (${socketUrl}):`, error.message);
    });
  }

  return socket;
}

export function joinBranchRoom(branchId: string) {
  currentBranchId = branchId;
  const s = getSocket();
  if (s.connected) {
    s.emit("join_branch", { branchId });
    console.log("[Socket.io] Joined branch room:", branchId);
  }
}

export function leaveBranchRoom(branchId: string) {
  if (currentBranchId === branchId) {
    currentBranchId = null;
  }
  const s = getSocket();
  if (s.connected) {
    s.emit("leave_branch", { branchId });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
