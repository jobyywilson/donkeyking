import { describe, it, expect } from "vitest";
import {
  compareCards,
  isValidCardPlay,
  findTrickWinner,
  shouldPlayerCollectCards,
  checkGameOver,
  findGameWinner,
  findGameLoser,
} from "./game-rules";
import { Card, Player } from "@shared/game";

/**
 * GAME RULES UNIT TESTS
 *
 * Test individual rule functions to ensure game logic works correctly
 */

describe("DonkeyKing Game Rules", () => {
  // Helper function to create test cards
  const createCard = (rank: string, suit: string, id?: string): Card => ({
    rank: rank as any,
    suit: suit as any,
    id: id || `${suit}-${rank}-test`,
  });

  // Helper function to create test players
  const createPlayer = (
    id: string,
    name: string,
    cardCount: number,
    collectedCards: number = 0,
  ): Player => ({
    id,
    name,
    displayName: name,
    cardCount,
    collectedCards,
    isReady: false,
    isHost: false,
    isCurrentTurn: false,
    sets: [],
    isConnected: true,
  });

  describe("Card Comparison", () => {
    it("should compare cards correctly", () => {
      const two = createCard("2", "hearts");
      const ace = createCard("A", "spades");
      const king = createCard("K", "clubs");
      const three = createCard("3", "diamonds");

      expect(compareCards(ace, king)).toBeGreaterThan(0); // Ace > King
      expect(compareCards(king, three)).toBeGreaterThan(0); // King > 3
      expect(compareCards(two, three)).toBeLessThan(0); // 2 < 3
      expect(compareCards(ace, ace)).toBe(0); // Ace = Ace
    });
  });

  describe("Card Play Validation", () => {
    const heartsCard = createCard("A", "hearts");
    const spadesCard = createCard("K", "spades");
    const clubsCard = createCard("Q", "clubs");

    it("should allow any card for first play", () => {
      const playerCards = [heartsCard, spadesCard, clubsCard];
      const result = isValidCardPlay(heartsCard, [], playerCards);
      expect(result).toBe(true);
    });

    it("should require following suit if possible", () => {
      const playerCards = [heartsCard, spadesCard, clubsCard];
      const currentTrick = [createCard("3", "hearts")];

      // Player has hearts, must play hearts
      expect(
        isValidCardPlay(heartsCard, currentTrick, playerCards, "hearts"),
      ).toBe(true);
      expect(
        isValidCardPlay(spadesCard, currentTrick, playerCards, "hearts"),
      ).toBe(false);
    });

    it("should allow any card if cannot follow suit", () => {
      const playerCards = [spadesCard, clubsCard]; // No hearts
      const currentTrick = [createCard("3", "hearts")];

      expect(
        isValidCardPlay(spadesCard, currentTrick, playerCards, "hearts"),
      ).toBe(true);
      expect(
        isValidCardPlay(clubsCard, currentTrick, playerCards, "hearts"),
      ).toBe(true);
    });
  });

  describe("Trick Winner Logic", () => {
    it("should find highest card of lead suit", () => {
      const trick = [
        createCard("3", "hearts"),
        createCard("A", "spades"),
        createCard("K", "hearts"),
        createCard("2", "hearts"),
      ];

      const winner = findTrickWinner(trick, "hearts");
      expect(winner?.rank).toBe("K"); // King of hearts wins
    });

    it("should return null for bent cards (all same rank)", () => {
      const trick = [
        createCard("A", "hearts"),
        createCard("A", "spades"),
        createCard("A", "clubs"),
        createCard("A", "diamonds"),
      ];

      const winner = findTrickWinner(trick, "hearts");
      expect(winner).toBeNull(); // All aces = bent cards
    });

    it("should handle mixed suits correctly", () => {
      const trick = [
        createCard("3", "hearts"), // Lead suit
        createCard("A", "spades"), // Higher rank but wrong suit
        createCard("2", "hearts"), // Same suit but lower
        createCard("K", "clubs"), // Different suit
      ];

      const winner = findTrickWinner(trick, "hearts");
      expect(winner?.rank).toBe("3"); // 3 of hearts wins (only hearts in lead suit)
    });
  });

  describe("Card Collection Rules", () => {
    it("should not collect bent cards", () => {
      const trick = [
        createCard("A", "hearts"),
        createCard("A", "spades"),
        createCard("A", "clubs"),
        createCard("A", "diamonds"),
      ];

      const shouldCollect = shouldPlayerCollectCards(trick);
      expect(shouldCollect).toBe(false);
    });

    it("should collect normal tricks", () => {
      const trick = [
        createCard("3", "hearts"),
        createCard("A", "spades"),
        createCard("K", "hearts"),
        createCard("2", "hearts"),
      ];

      const shouldCollect = shouldPlayerCollectCards(trick);
      expect(shouldCollect).toBe(true);
    });
  });

  describe("Win/Lose Conditions", () => {
    it("should detect game over when player has no cards", () => {
      const players = [
        createPlayer("1", "Alice", 0), // No cards = winner
        createPlayer("2", "Bob", 5),
        createPlayer("3", "Charlie", 3),
        createPlayer("4", "Diana", 7),
      ];

      expect(checkGameOver(players)).toBe(true);
    });

    it("should not detect game over when all players have cards", () => {
      const players = [
        createPlayer("1", "Alice", 3),
        createPlayer("2", "Bob", 5),
        createPlayer("3", "Charlie", 2),
        createPlayer("4", "Diana", 7),
      ];

      expect(checkGameOver(players)).toBe(false);
    });

    it("should find winner (player with no cards)", () => {
      const players = [
        createPlayer("1", "Alice", 3),
        createPlayer("2", "Bob", 0), // Winner
        createPlayer("3", "Charlie", 2),
        createPlayer("4", "Diana", 7),
      ];

      const winnerId = findGameWinner(players);
      expect(winnerId).toBe("2");
    });

    it("should find loser (player with most collected cards)", () => {
      const players = [
        createPlayer("1", "Alice", 3, 5),
        createPlayer("2", "Bob", 0, 2),
        createPlayer("3", "Charlie", 2, 12), // Most collected = donkey
        createPlayer("4", "Diana", 7, 8),
      ];

      const loserId = findGameLoser(players);
      expect(loserId).toBe("3");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty trick", () => {
      const winner = findTrickWinner([]);
      expect(winner).toBeNull();
    });

    it("should handle single card trick", () => {
      const trick = [createCard("A", "hearts")];
      const winner = findTrickWinner(trick, "hearts");
      expect(winner?.rank).toBe("A");
    });

    it("should handle no lead suit", () => {
      const trick = [createCard("3", "hearts"), createCard("A", "spades")];

      const winner = findTrickWinner(trick); // No lead suit specified
      expect(winner?.rank).toBe("3"); // First card wins
    });
  });
});
