/**
 * DONKEY KING GAME SIMULATOR
 *
 * A utility class for easily testing game scenarios manually or in tests.
 * This simulates the entire game flow without needing WebSockets.
 */

import { GameServer } from "./game-server";
import { Server as HTTPServer } from "http";
import { GAME_RULES } from "./game-rules";
import { GameRoom, Player, Card } from "@shared/game";

export class GameSimulator {
  private gameServer: GameServer;
  private httpServer: HTTPServer;
  private room: GameRoom | null = null;
  private playerCards: Map<string, Card[]> = new Map();

  constructor() {
    this.httpServer = new HTTPServer();
    this.gameServer = new GameServer(this.httpServer);
  }

  /**
   * Quick game setup with 4 players
   */
  async setupQuickGame(): Promise<{
    room: GameRoom;
    players: Player[];
    playerCards: Map<string, Card[]>;
  }> {
    console.log("🎮 Setting up quick game...");

    // Create room
    this.room = this.createTestRoom();

    // Add 4 players
    const playerNames = ["Alice", "Bob", "Charlie", "Diana"];
    for (const name of playerNames) {
      this.addTestPlayer(name);
    }

    // Deal cards
    this.dealCards();

    console.log(`✅ Game ready with ${this.room.players.length} players`);
    return {
      room: this.room,
      players: this.room.players,
      playerCards: this.playerCards,
    };
  }

  /**
   * Simulate playing a complete trick
   */
  playTrick(cards: { playerId: string; cardId: string }[]): {
    winner: Player | null;
    bentCards: boolean;
    result: string;
  } {
    if (!this.room) throw new Error("No game set up");

    console.log("\n🃏 Playing trick:");

    // Simulate each card play
    const trick: Card[] = [];
    let leadSuit: string | undefined;

    for (const { playerId, cardId } of cards) {
      const player = this.room.players.find((p) => p.id === playerId);
      const playerCards = this.playerCards.get(playerId) || [];
      const card = playerCards.find((c) => c.id === cardId);

      if (!player || !card) {
        throw new Error(`Invalid player or card: ${playerId}, ${cardId}`);
      }

      // Set lead suit on first card
      if (trick.length === 0) {
        leadSuit = card.suit;
      }

      trick.push({ ...card, playedBy: playerId } as any);
      console.log(`  ${player.displayName} plays ${card.rank} of ${card.suit}`);

      // Remove card from player's hand
      const updatedCards = playerCards.filter((c) => c.id !== cardId);
      this.playerCards.set(playerId, updatedCards);
      player.cardCount = updatedCards.length;
    }

    // Determine winner
    const winningCard = GAME_RULES.findTrickWinner(trick, leadSuit);
    const bentCards = winningCard === null;

    if (bentCards) {
      console.log("  🔥 BENT CARDS! All same rank - no winner");
      return { winner: null, bentCards: true, result: "Bent cards" };
    }

    const winnerId = (winningCard as any).playedBy;
    const winner = this.room.players.find((p) => p.id === winnerId);

    if (winner && GAME_RULES.shouldCollectCards(trick, leadSuit)) {
      winner.collectedCards += trick.length;
      console.log(
        `  🏆 ${winner.displayName} wins with ${winningCard!.rank} of ${winningCard!.suit}`,
      );
      console.log(
        `     Collected ${trick.length} cards (total: ${winner.collectedCards})`,
      );
    }

    return { winner, bentCards: false, result: `${winner?.displayName} wins` };
  }

  /**
   * Check if game is over and get results
   */
  checkGameStatus(): {
    gameOver: boolean;
    winner?: Player;
    donkey?: Player;
    status: string;
  } {
    if (!this.room) throw new Error("No game set up");

    const gameOver = GAME_RULES.isGameOver(this.room.players);

    if (gameOver) {
      const winnerId = GAME_RULES.findWinner(this.room.players);
      const donkeyId = GAME_RULES.findLoser(this.room.players);

      const winner = this.room.players.find((p) => p.id === winnerId);
      const donkey = this.room.players.find((p) => p.id === donkeyId);

      return {
        gameOver: true,
        winner,
        donkey,
        status: `${winner?.displayName} wins! ${donkey?.displayName} is the donkey!`,
      };
    }

    return {
      gameOver: false,
      status: "Game continues...",
    };
  }

  /**
   * Print current game state
   */
  printGameState(): void {
    if (!this.room) {
      console.log("No game in progress");
      return;
    }

    console.log("\n📊 CURRENT GAME STATE:");
    console.log("========================");

    for (const player of this.room.players) {
      const cards = this.playerCards.get(player.id) || [];
      console.log(
        `${player.displayName}: ${player.cardCount} cards, ${player.collectedCards} collected`,
      );
      console.log(
        `  Cards: ${cards.map((c) => `${c.rank}${c.suit[0]}`).join(", ")}`,
      );
    }
  }

  /**
   * Create example game scenarios for testing
   */
  createTestScenarios(): {
    normalTrick: { playerId: string; cardId: string }[];
    bentCardsTrick: { playerId: string; cardId: string }[];
    winningScenario: void;
  } {
    if (!this.room) throw new Error("No game set up");

    const players = this.room.players;

    // Normal trick - different ranks
    const normalTrick = [
      {
        playerId: players[0].id,
        cardId: this.getPlayerCard(players[0].id, "3", "hearts")?.id || "",
      },
      {
        playerId: players[1].id,
        cardId: this.getPlayerCard(players[1].id, "7", "hearts")?.id || "",
      },
      {
        playerId: players[2].id,
        cardId: this.getPlayerCard(players[2].id, "J", "spades")?.id || "",
      },
      {
        playerId: players[3].id,
        cardId: this.getPlayerCard(players[3].id, "K", "hearts")?.id || "",
      },
    ];

    // Bent cards trick - all same rank (if available)
    const bentCardsTrick = [
      {
        playerId: players[0].id,
        cardId: this.getPlayerCard(players[0].id, "A")?.id || "",
      },
      {
        playerId: players[1].id,
        cardId: this.getPlayerCard(players[1].id, "A")?.id || "",
      },
      {
        playerId: players[2].id,
        cardId: this.getPlayerCard(players[2].id, "A")?.id || "",
      },
      {
        playerId: players[3].id,
        cardId: this.getPlayerCard(players[3].id, "A")?.id || "",
      },
    ];

    return {
      normalTrick,
      bentCardsTrick,
      winningScenario: this.setupWinningScenario(),
    };
  }

  // Private helper methods

  private createTestRoom(): GameRoom {
    return {
      id: "TEST123",
      players: [],
      gameState: "playing",
      currentPlayerIndex: 0,
      maxPlayers: GAME_RULES.maxPlayers,
      createdAt: new Date(),
      centerCards: [],
      currentTrick: [],
      trickStartPlayer: 0,
    };
  }

  private addTestPlayer(name: string): void {
    if (!this.room) return;

    const player: Player = {
      id: `player-${this.room.players.length + 1}`,
      name,
      displayName: name,
      cardCount: 0,
      isReady: true,
      isHost: this.room.players.length === 0,
      isCurrentTurn: this.room.players.length === 0,
      sets: [],
      isConnected: true,
      collectedCards: 0,
    };

    this.room.players.push(player);
  }

  private dealCards(): void {
    if (!this.room) return;

    const deck = this.createTestDeck();
    const cardsPerPlayer = GAME_RULES.cardsPerPlayer;

    for (const player of this.room.players) {
      const cards = deck.splice(0, cardsPerPlayer);
      this.playerCards.set(player.id, cards);
      player.cardCount = cards.length;
    }
  }

  private createTestDeck(): Card[] {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = [
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

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit: suit as any,
          rank: rank as any,
          id: `${suit}-${rank}-${Math.random().toString(36).substr(2, 6)}`,
        });
      }
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  private getPlayerCard(
    playerId: string,
    rank?: string,
    suit?: string,
  ): Card | undefined {
    const cards = this.playerCards.get(playerId) || [];

    if (rank && suit) {
      return cards.find((c) => c.rank === rank && c.suit === suit);
    } else if (rank) {
      return cards.find((c) => c.rank === rank);
    } else {
      return cards[0]; // Return first card
    }
  }

  private setupWinningScenario(): void {
    if (!this.room) return;

    // Set one player to have only 1 card left (about to win)
    const player = this.room.players[0];
    const cards = this.playerCards.get(player.id) || [];

    if (cards.length > 1) {
      this.playerCards.set(player.id, [cards[0]]); // Keep only first card
      player.cardCount = 1;
    }
  }
}

// Example usage function for manual testing
export function runGameSimulation(): void {
  const simulator = new GameSimulator();

  console.log("🎮 DONKEY KING GAME SIMULATION");
  console.log("==============================\n");

  // Setup game
  simulator.setupQuickGame().then(({ room, players }) => {
    simulator.printGameState();

    // Create test scenarios
    const scenarios = simulator.createTestScenarios();

    // Play normal trick
    console.log("\n🎯 SCENARIO 1: Normal Trick");
    simulator.playTrick(scenarios.normalTrick);
    simulator.printGameState();

    // Check game status
    const status = simulator.checkGameStatus();
    console.log(`\n📈 Status: ${status.status}`);

    // Try bent cards if possible
    if (scenarios.bentCardsTrick.every((play) => play.cardId)) {
      console.log("\n🎯 SCENARIO 2: Bent Cards (All Same Rank)");
      simulator.playTrick(scenarios.bentCardsTrick);
      simulator.printGameState();
    }
  });
}
