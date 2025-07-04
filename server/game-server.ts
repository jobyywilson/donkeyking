import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import {
  GameRoom,
  Player,
  Card,
  GameState,
  SocketEvent,
  SocketResponse,
} from "@shared/game";

export class GameServer {
  private io: Server;
  private rooms: Map<string, GameRoom> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("Player connected:", socket.id);

      socket.on("message", (event: SocketEvent) => {
        try {
          this.handleSocketEvent(socket, event);
        } catch (error) {
          console.error("Socket event error:", error);
          this.sendToSocket(socket, {
            type: "ERROR",
            payload: { message: "An error occurred" },
          });
        }
      });

      socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        this.handlePlayerDisconnect(socket.id);
      });
    });
  }

  private handleSocketEvent(socket: any, event: SocketEvent) {
    switch (event.type) {
      case "CREATE_ROOM":
        this.createRoom(socket, event.payload.playerName);
        break;
      case "JOIN_ROOM":
        this.joinRoom(socket, event.payload.roomId, event.payload.playerName);
        break;
      case "READY_UP":
        this.readyUp(socket);
        break;
      case "START_GAME":
        this.startGame(socket);
        break;
      case "PASS_CARDS":
        this.passCards(socket, event.payload.cardIds);
        break;
      case "MAKE_SET":
        this.makeSet(socket, event.payload.cardIds);
        break;
      case "LEAVE_ROOM":
        this.leaveRoom(socket);
        break;
    }
  }

  private createRoom(socket: any, playerName: string): void {
    const roomId = this.generateRoomId();
    const player: Player = {
      id: socket.id,
      name: playerName,
      cardCount: 0,
      isReady: false,
      isHost: true,
      isCurrentTurn: false,
      sets: [],
      isConnected: true,
    };

    const room: GameRoom = {
      id: roomId,
      players: [player],
      gameState: "waiting",
      currentPlayerIndex: 0,
      maxPlayers: 6,
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    socket.join(roomId);
    socket.roomId = roomId;

    const gameState: GameState = {
      room,
      myCards: [],
      myId: socket.id,
      selectedCards: [],
      canPass: false,
      passDirection: "left",
    };

    this.sendToSocket(socket, {
      type: "ROOM_CREATED",
      payload: { roomId, gameState },
    });
  }

  private joinRoom(socket: any, roomId: string, playerName: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "Room not found" },
      });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "Room is full" },
      });
      return;
    }

    if (room.gameState !== "waiting") {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "Game already in progress" },
      });
      return;
    }

    // Check if this player is rejoining (same name)
    const existingPlayer = room.players.find((p) => p.name === playerName);
    let isHost = false;

    if (existingPlayer) {
      // Player is rejoining - preserve their host status
      isHost = existingPlayer.isHost;
      // Remove the old entry
      room.players = room.players.filter((p) => p.name !== playerName);
    } else {
      // New player - only make host if no current host exists
      isHost = !room.players.some((p) => p.isHost);
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      cardCount: 0,
      isReady: false,
      isHost: isHost,
      isCurrentTurn: false,
      sets: [],
      isConnected: true,
    };

    room.players.push(player);
    socket.join(roomId);
    socket.roomId = roomId;

    const gameState: GameState = {
      room,
      myCards: [],
      myId: socket.id,
      selectedCards: [],
      canPass: false,
      passDirection: "left",
    };

    this.sendToSocket(socket, {
      type: "ROOM_JOINED",
      payload: gameState,
    });

    // Update all players in the room with the new player list
    this.broadcastGameStateToRoom(roomId);
  }

  private readyUp(socket: any): void {
    // Ready up functionality removed - players can start immediately when host decides
    console.log("Ready up request ignored - functionality removed");
  }

  private startGame(socket: any): void {
    const room = this.rooms.get(socket.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player?.isHost) return;

    if (room.players.length < 2) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "Need at least 2 players to start" },
      });
      return;
    }

    // No ready requirement - host can start with any number of players >= 2

    this.initializeGame(room);
  }

  private initializeGame(room: GameRoom): void {
    room.gameState = "playing";
    room.currentPlayerIndex = 0;

    // Reset all players' turn status
    room.players.forEach((player, index) => {
      player.isCurrentTurn = index === 0;
      player.sets = [];
    });

    // Create and shuffle deck
    const deck = this.createDeck();
    const cardsPerPlayer = Math.floor(52 / room.players.length);

    console.log(
      `Dealing ${cardsPerPlayer} cards to each of ${room.players.length} players`,
    );

    // Store each player's cards separately for security
    const playerCards: Map<string, Card[]> = new Map();

    // Deal cards to each player
    for (let i = 0; i < room.players.length; i++) {
      const cards = deck.splice(0, cardsPerPlayer);
      playerCards.set(room.players[i].id, cards);
      room.players[i].cardCount = cards.length;

      console.log(`Player ${room.players[i].name} dealt ${cards.length} cards`);
    }

    // Send game state to each player individually with their own cards
    room.players.forEach((player, index) => {
      const playerSocket = this.io.sockets.sockets.get(player.id);
      if (playerSocket) {
        const gameState: GameState = {
          room: {
            ...room,
            // Don't send other players' detailed info
            players: room.players.map((p) => ({
              ...p,
              // Only show card count for other players, not actual cards
              sets: p.id === player.id ? p.sets : p.sets,
            })),
          },
          myCards: playerCards.get(player.id) || [],
          myId: player.id,
          selectedCards: [],
          canPass: index === 0, // Only first player can pass initially
          passDirection: "left",
        };

        this.sendToSocket(playerSocket, {
          type: "GAME_STARTED",
          payload: gameState,
        });
      }
    });

    console.log(
      `Game started in room ${room.id} with ${room.players.length} players`,
    );
  }

  private passCards(socket: any, cardIds: string[]): void {
    const room = this.rooms.get(socket.roomId);
    if (!room || room.gameState !== "playing") return;

    const currentPlayer = room.players.find((p) => p.id === socket.id);
    if (!currentPlayer?.isCurrentTurn) return;

    // In Indian Donkey, typically pass 1 card to the next player
    if (cardIds.length !== 1) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "You can only pass 1 card" },
      });
      return;
    }

    // Move to next player's turn
    room.currentPlayerIndex =
      (room.currentPlayerIndex + 1) % room.players.length;

    // Update turn status
    room.players.forEach((p, index) => {
      p.isCurrentTurn = index === room.currentPlayerIndex;
    });

    this.broadcastGameStateUpdate(room);
  }

  private makeSet(socket: any, cardIds: string[]): void {
    const room = this.rooms.get(socket.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Validate set of 4 cards with same rank
    if (cardIds.length !== 4) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "A set must have exactly 4 cards" },
      });
      return;
    }

    // Here you would validate the set and update game state
    // For now, just update card count
    player.cardCount -= 4;

    // Check for win condition
    if (player.cardCount === 0) {
      room.gameState = "finished";
      room.winner = player.id;

      // Find the donkey (last player with cards)
      const playersWithCards = room.players.filter((p) => p.cardCount > 0);
      if (playersWithCards.length === 1) {
        room.donkey = playersWithCards[0].id;
      }

      this.broadcastToRoom(room.id, {
        type: "GAME_FINISHED",
        payload: { winner: room.winner, donkey: room.donkey || "" },
      });
    } else {
      this.broadcastGameStateUpdate(room);
    }
  }

  private leaveRoom(socket: any): void {
    this.handlePlayerDisconnect(socket.id);
  }

  private handlePlayerDisconnect(socketId: string): void {
    for (const [roomId, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.id === socketId);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
          this.rooms.delete(roomId);
        } else {
          // If the host left, make the first remaining player the new host
          const currentHost = room.players.find((p) => p.isHost);
          if (!currentHost) {
            // Clear any incorrect host flags and assign to first player
            room.players.forEach((p) => (p.isHost = false));
            room.players[0].isHost = true;
            console.log(
              `New host assigned: ${room.players[0].name} in room ${roomId}`,
            );
          }

          this.broadcastGameStateToRoom(roomId);
        }
        break;
      }
    }
  }

  private broadcastGameStateUpdate(room: GameRoom): void {
    room.players.forEach((player) => {
      const playerSocket = this.io.sockets.sockets.get(player.id);
      if (playerSocket) {
        const gameState: GameState = {
          room: {
            ...room,
            // Only show public player information
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              cardCount: p.cardCount,
              isReady: p.isReady,
              isHost: p.isHost,
              isCurrentTurn: p.isCurrentTurn,
              sets: p.sets, // Sets are public information
              isConnected: p.isConnected,
            })),
          },
          myCards: [], // Cards are kept private and not sent in updates
          myId: player.id,
          selectedCards: [],
          canPass: player.isCurrentTurn,
          passDirection: "left",
        };

        this.sendToSocket(playerSocket, {
          type: "GAME_STATE_UPDATE",
          payload: gameState,
        });
      }
    });
  }

  private broadcastGameStateToRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.forEach((player) => {
      const playerSocket = this.io.sockets.sockets.get(player.id);
      if (playerSocket) {
        const gameState: GameState = {
          room: {
            ...room,
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              cardCount: p.cardCount,
              isReady: p.isReady,
              isHost: p.isHost,
              isCurrentTurn: p.isCurrentTurn,
              sets: p.sets,
              isConnected: p.isConnected,
            })),
          },
          myCards: [], // Cards are not included in lobby updates
          myId: player.id,
          selectedCards: [],
          canPass: false,
          passDirection: "left",
        };

        this.sendToSocket(playerSocket, {
          type: "GAME_STATE_UPDATE",
          payload: gameState,
        });
      }
    });
  }

  private broadcastToRoom(roomId: string, message: SocketResponse): void {
    this.io.to(roomId).emit("message", message);
  }

  private sendToSocket(socket: any, message: SocketResponse): void {
    socket.emit("message", message);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private createDeck(): Card[] {
    const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Card["rank"][] = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    const deck: Card[] = [];

    // Create all 52 cards
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    }

    // Shuffle deck thoroughly using Fisher-Yates algorithm
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    console.log(`Created and shuffled deck of ${deck.length} cards`);
    return deck;
  }
}
