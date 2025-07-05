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
      case "PLAY_CARD":
        this.playCard(socket, event.payload.cardId);
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
      displayName: playerName, // First player always gets their name as-is
      cardCount: 0,
      isReady: false,
      isHost: true,
      isCurrentTurn: false,
      sets: [],
      isConnected: true,
      collectedCards: 0,
    };

    const room: GameRoom = {
      id: roomId,
      players: [player],
      gameState: "waiting",
      currentPlayerIndex: 0,
      maxPlayers: 4,
      createdAt: new Date(),
      centerCards: [],
      currentTrick: [],
      trickStartPlayer: 0,
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

    // Check if this player is rejoining (same socket ID)
    const existingPlayer = room.players.find((p) => p.id === socket.id);
    let isHost = false;

    if (existingPlayer) {
      // Player is rejoining - preserve their host status
      isHost = existingPlayer.isHost;
      // Remove the old entry
      room.players = room.players.filter((p) => p.id !== socket.id);
    } else {
      // New player - only make host if no current host exists
      isHost = !room.players.some((p) => p.isHost);
    }

    // Generate unique display name
    const displayName = this.generateUniqueDisplayName(room, playerName);

    const player: Player = {
      id: socket.id,
      name: playerName,
      displayName: displayName,
      cardCount: 0,
      isReady: false,
      isHost: isHost,
      isCurrentTurn: false,
      sets: [],
      isConnected: true,
      collectedCards: 0,
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

    if (room.players.length !== 4) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "Need exactly 4 players to start" },
      });
      return;
    }

    // No ready requirement - host can start with any number of players >= 2

    this.initializeGame(room);
  }

  private initializeGame(room: GameRoom): void {
    room.gameState = "playing";
    room.currentPlayerIndex = 0;
    room.centerCards = [];
    room.currentTrick = [];
    room.trickLeadSuit = undefined;
    room.trickStartPlayer = 0;

    // Reset all players' turn status
    room.players.forEach((player, index) => {
      player.isCurrentTurn = index === 0;
      player.sets = [];
      player.collectedCards = 0;
    });

    // Create and shuffle deck
    const deck = this.createDeck();
    const cardsPerPlayer = 13; // Exactly 13 cards per player for 4 players

    console.log(
      `Dealing ${cardsPerPlayer} cards to each of ${room.players.length} players`,
    );

    // Deal cards to each player using storage system
    for (let i = 0; i < room.players.length; i++) {
      const cards = deck.splice(0, cardsPerPlayer);
      this.setPlayerCards(room, room.players[i].id, cards);
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
            players: room.players.map((p) => ({
              ...p,
              sets: p.id === player.id ? p.sets : p.sets,
            })),
          },
          myCards: this.getPlayerCards(room, player.id),
          myId: player.id,
          selectedCards: [],
          canPass: index === 0,
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

  private playCard(socket: any, cardId: string): void {
    const room = this.rooms.get(socket.roomId);
    if (!room || room.gameState !== "playing") return;

    const currentPlayer = room.players.find((p) => p.id === socket.id);
    if (!currentPlayer?.isCurrentTurn) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "Not your turn!" },
      });
      return;
    }

    // Get player's cards (stored separately for security)
    const playerCards = this.getPlayerCards(room, socket.id);
    const cardToPlay = playerCards.find((card) => card.id === cardId);

    if (!cardToPlay) {
      this.sendToSocket(socket, {
        type: "ERROR",
        payload: { message: "Card not found in your hand" },
      });
      return;
    }

    // Check if this is the first card of the trick (sets the lead suit)
    if (room.currentTrick.length === 0) {
      room.trickLeadSuit = cardToPlay.suit;
    }

    // Remove card from player's hand
    this.removeCardFromPlayer(room, socket.id, cardId);
    currentPlayer.cardCount--;

    // Add card to current trick
    room.currentTrick.push({
      ...cardToPlay,
      playedBy: socket.id,
    } as any);

    console.log(
      `${currentPlayer.name} played ${cardToPlay.rank} of ${cardToPlay.suit}`,
    );

    // Check if trick is complete (4 cards played)
    if (room.currentTrick.length === 4) {
      this.completeTrick(room);
    } else {
      // Move to next player's turn
      room.currentPlayerIndex =
        (room.currentPlayerIndex + 1) % room.players.length;

      // Update turn status
      room.players.forEach((p, index) => {
        p.isCurrentTurn = index === room.currentPlayerIndex;
      });
    }

    // Check for win condition (player has no cards left)
    if (room.players.some((p) => p.cardCount === 0)) {
      room.gameState = "finished";
      // Winner is player with no cards
      room.winner = room.players.find((p) => p.cardCount === 0)?.id;
      // Donkey is player with most collected cards
      const maxCollected = Math.max(
        ...room.players.map((p) => p.collectedCards),
      );
      room.donkey = room.players.find(
        (p) => p.collectedCards === maxCollected,
      )?.id;
    }

    this.broadcastGameStateUpdate(room);
  }

  private completeTrick(room: GameRoom): void {
    const leadSuit = room.trickLeadSuit;
    console.log(`Completing trick with lead suit: ${leadSuit}`);

    // Find the highest card of the lead suit
    const leadSuitCards = room.currentTrick.filter(
      (card) => card.suit === leadSuit,
    );

    let winningCard = leadSuitCards[0];
    if (leadSuitCards.length > 1) {
      // Compare cards of the same suit to find highest
      winningCard = leadSuitCards.reduce((highest, current) => {
        if (this.compareCards(current, highest) > 0) {
          return current;
        }
        return highest;
      });
    }

    // Find the player who played the winning card
    const winnerPlayerId = (winningCard as any).playedBy;
    const winnerPlayer = room.players.find((p) => p.id === winnerPlayerId);

    if (winnerPlayer) {
      // Winner collects all cards from the trick
      winnerPlayer.collectedCards += room.currentTrick.length;
      console.log(
        `${winnerPlayer.name} wins trick with ${winningCard.rank} of ${winningCard.suit}, collected ${room.currentTrick.length} cards`,
      );

      // Winner starts the next trick
      const winnerIndex = room.players.findIndex(
        (p) => p.id === winnerPlayerId,
      );
      room.currentPlayerIndex = winnerIndex;
      room.trickStartPlayer = winnerIndex;

      // Update turn status - winner goes first
      room.players.forEach((p, index) => {
        p.isCurrentTurn = index === winnerIndex;
      });
    }

    // Clear the trick and reset lead suit
    room.centerCards.push(...room.currentTrick);
    room.currentTrick = [];
    room.trickLeadSuit = undefined;
  }

  private compareCards(card1: Card, card2: Card): number {
    const rankOrder = [
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
      "A",
    ];
    const rank1Index = rankOrder.indexOf(card1.rank);
    const rank2Index = rankOrder.indexOf(card2.rank);
    return rank1Index - rank2Index;
  }

  private passCards(socket: any, cardIds: string[]): void {
    // Deprecated - replaced with playCard
    this.sendToSocket(socket, {
      type: "ERROR",
      payload: { message: "Card passing not available in this game mode" },
    });
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
    console.log(`Player ${socket.id} requested to leave room`);

    // Send confirmation to the leaving player
    this.sendToSocket(socket, {
      type: "PLAYER_LEFT",
      payload: { playerId: socket.id },
    });

    // Remove from room
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
          myCards: this.getPlayerCards(room, player.id), // Send actual player cards
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
          myCards: this.getPlayerCards(room, player.id), // Send actual player cards
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

  private playerCardStorage: Map<string, Map<string, Card[]>> = new Map();

  private generateUniqueDisplayName(
    room: GameRoom,
    desiredName: string,
  ): string {
    const existingNames = room.players.map((p) => p.displayName);

    // If name is unique, use it as-is
    if (!existingNames.includes(desiredName)) {
      return desiredName;
    }

    // Find the next available number
    let counter = 2;
    let displayName = `${desiredName} (${counter})`;

    while (existingNames.includes(displayName)) {
      counter++;
      displayName = `${desiredName} (${counter})`;
    }

    return displayName;
  }

  private getPlayerCards(room: GameRoom, playerId: string): Card[] {
    const roomCards = this.playerCardStorage.get(room.id);
    if (!roomCards) return [];
    return roomCards.get(playerId) || [];
  }

  private setPlayerCards(
    room: GameRoom,
    playerId: string,
    cards: Card[],
  ): void {
    if (!this.playerCardStorage.has(room.id)) {
      this.playerCardStorage.set(room.id, new Map());
    }
    this.playerCardStorage.get(room.id)!.set(playerId, cards);
  }

  private removeCardFromPlayer(
    room: GameRoom,
    playerId: string,
    cardId: string,
  ): void {
    const playerCards = this.getPlayerCards(room, playerId);
    const updatedCards = playerCards.filter((card) => card.id !== cardId);
    this.setPlayerCards(room, playerId, updatedCards);
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
