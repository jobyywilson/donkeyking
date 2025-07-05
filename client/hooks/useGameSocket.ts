import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, SocketEvent, SocketResponse } from "@shared/game";

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the WebSocket server
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      timeout: 15000,
      upgrade: true,
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to game server", socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from game server:", reason);
      setIsConnected(false);
    });

    socket.on("message", (response: SocketResponse) => {
      console.log("📨 Received:", response);
      handleSocketResponse(response);
    });

    socket.on("connect_error", (error) => {
      console.error("🚫 Connection error:", error);
      setError(
        "Unable to connect to game server. Please try refreshing the page.",
      );
      setIsConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setError(null);
    });

    socket.on("reconnect_error", (error) => {
      console.error("🔄❌ Reconnection error:", error);
      setError("Connection lost. Please refresh the page to reconnect.");
    });

    socket.on("reconnecting", (attemptNumber) => {
      console.log("🔄 Attempting to reconnect...", attemptNumber);
      setError("Reconnecting to game server...");
    });

    socket.on("reconnect_failed", () => {
      console.error("🔄❌ Reconnection failed completely");
      setError("Unable to reconnect. Please refresh the page.");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSocketResponse = (response: SocketResponse) => {
    setError(null);

    switch (response.type) {
      case "ROOM_CREATED":
        console.log("Room created successfully:", response.payload);
        setGameState(response.payload.gameState);
        break;

      case "ROOM_JOINED":
      case "GAME_STARTED":
      case "GAME_STATE_UPDATE":
        console.log("Game state updated:", response.type, response.payload);
        setGameState(response.payload);
        break;

      case "PLAYER_JOINED":
      case "PLAYER_LEFT":
        // These events are now handled by GAME_STATE_UPDATE
        console.log("Player list change:", response.type);
        break;

      case "GAME_FINISHED":
        if (gameState) {
          setGameState({
            ...gameState,
            room: {
              ...gameState.room,
              gameState: "finished",
              winner: response.payload.winner,
              donkey: response.payload.donkey,
            },
          });
        }
        break;

      case "ERROR":
        setError(response.payload.message);
        break;
    }
  };

  const sendMessage = (event: SocketEvent) => {
    console.log("Sending message:", event);
    if (socketRef.current?.connected) {
      socketRef.current.emit("message", event);
    } else {
      console.error("Socket not connected, cannot send message");
      setError("Not connected to game server");
    }
  };

  const createRoom = (playerName: string) => {
    console.log("Creating room for player:", playerName);
    sendMessage({ type: "CREATE_ROOM", payload: { playerName } });
  };

  const joinRoom = (roomId: string, playerName: string) => {
    sendMessage({ type: "JOIN_ROOM", payload: { roomId, playerName } });
  };

  const readyUp = () => {
    sendMessage({ type: "READY_UP", payload: {} });
  };

  const startGame = () => {
    sendMessage({ type: "START_GAME", payload: {} });
  };

  const playCard = (cardId: string) => {
    console.log("Playing card:", cardId);
    sendMessage({ type: "PLAY_CARD", payload: { cardId } });
  };

  const passCards = (cardIds: string[]) => {
    sendMessage({ type: "PASS_CARDS", payload: { cardIds } });
  };

  const makeSet = (cardIds: string[]) => {
    sendMessage({ type: "MAKE_SET", payload: { cardIds } });
  };

  const leaveRoom = () => {
    console.log("Leaving room...");
    sendMessage({ type: "LEAVE_ROOM", payload: {} });
    // Reset local game state immediately
    setGameState(null);
    setError(null);
  };

  return {
    gameState,
    isConnected,
    error,
    createRoom,
    joinRoom,
    readyUp,
    startGame,
    playCard,
    passCards,
    makeSet,
    leaveRoom,
  };
}
