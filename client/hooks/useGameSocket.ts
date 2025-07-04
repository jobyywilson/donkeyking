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
      transports: ["websocket", "polling"],
      timeout: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to game server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from game server");
      setIsConnected(false);
    });

    socket.on("message", (response: SocketResponse) => {
      console.log("Received:", response);
      handleSocketResponse(response);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setError("Failed to connect to game server");
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

  const passCards = (cardIds: string[]) => {
    sendMessage({ type: "PASS_CARDS", payload: { cardIds } });
  };

  const makeSet = (cardIds: string[]) => {
    sendMessage({ type: "MAKE_SET", payload: { cardIds } });
  };

  const leaveRoom = () => {
    sendMessage({ type: "LEAVE_ROOM", payload: {} });
  };

  return {
    gameState,
    isConnected,
    error,
    createRoom,
    joinRoom,
    readyUp,
    startGame,
    passCards,
    makeSet,
    leaveRoom,
  };
}
