import { Card, GameRoom, Player } from "@shared/game";

/**
 * DONKEY KING GAME RULES CONFIGURATION
 *
 * This file contains all the customizable game rules and logic.
 * Modify these functions to change how the game works.
 */

export interface GameRules {
  // Basic game settings
  maxPlayers: number;
  cardsPerPlayer: number;

  // Game flow functions
  isValidPlay: (
    card: Card,
    trick: Card[],
    playerCards: Card[],
    leadSuit?: string,
  ) => boolean;
  findTrickWinner: (trick: Card[]) => Card;
  getNextPlayer: (room: GameRoom, currentIndex: number) => number;
  shouldCollectCards: (trick: Card[], leadSuit?: string) => boolean;
  isGameOver: (players: Player[]) => boolean;
  findWinner: (players: Player[]) => string | undefined;
  findLoser: (players: Player[]) => string | undefined;
}

/**
 * CARD COMPARISON LOGIC
 * Define which cards are higher than others
 */
export function compareCards(card1: Card, card2: Card): number {
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

/**
 * TURN ORDER LOGIC
 * Customize how turns progress
 */
export function getNextPlayerIndex(
  room: GameRoom,
  currentIndex: number,
): number {
  // Standard clockwise rotation
  return (currentIndex + 1) % room.players.length;
}

/**
 * CARD PLAY VALIDATION
 * Define when a player can play a specific card
 */
export function isValidCardPlay(
  card: Card,
  currentTrick: Card[],
  playerCards: Card[],
  leadSuit?: string,
): boolean {
  // If it's the first card of the trick, any card is valid
  if (currentTrick.length === 0) {
    return true;
  }

  // If there's a lead suit, check if player must follow suit
  if (leadSuit) {
    const hasLeadSuit = playerCards.some((c) => c.suit === leadSuit);

    if (hasLeadSuit) {
      // Player has cards of lead suit, must play one
      return card.suit === leadSuit;
    } else {
      // Player doesn't have lead suit, can play any card
      return true;
    }
  }

  return true;
}

/**
 * TRICK WINNER LOGIC
 * Define who wins each trick and gets the cards
 */
export function findTrickWinner(trick: Card[], leadSuit?: string): Card {
  if (!leadSuit || trick.length === 0) {
    return trick[0];
  }

  // Find all cards that match the lead suit
  const leadSuitCards = trick.filter((card) => card.suit === leadSuit);

  if (leadSuitCards.length === 0) {
    // No one followed suit (shouldn't happen with proper validation)
    return trick[0];
  }

  // Find the highest card of the lead suit
  return leadSuitCards.reduce((highest, current) => {
    return compareCards(current, highest) > 0 ? current : highest;
  });
}

/**
 * CARD COLLECTION LOGIC
 * Define when players should collect cards from tricks
 */
export function shouldPlayerCollectCards(
  trick: Card[],
  leadSuit?: string,
): boolean {
  // In Donkey King, winner always collects all cards from the trick
  return true;
}

/**
 * WIN/LOSE CONDITIONS
 * Define how the game ends and who wins/loses
 */
export function checkGameOver(players: Player[]): boolean {
  // Game ends when any player runs out of cards
  return players.some((player) => player.cardCount === 0);
}

export function findGameWinner(players: Player[]): string | undefined {
  // Winner is the first player to get rid of all their cards
  const winner = players.find((player) => player.cardCount === 0);
  return winner?.id;
}

export function findGameLoser(players: Player[]): string | undefined {
  // Loser (Donkey) is the player who collected the most cards
  const maxCollected = Math.max(...players.map((p) => p.collectedCards));
  const loser = players.find(
    (player) => player.collectedCards === maxCollected,
  );
  return loser?.id;
}

/**
 * SPECIAL RULES
 * Add any special game mechanics here
 */
export function applySpecialRules(
  room: GameRoom,
  playedCard: Card,
  player: Player,
): void {
  // Example: Special behavior for certain cards
  // if (playedCard.rank === 'A') {
  //   // Aces have special powers
  // }
  // Example: Penalty for certain combinations
  // if (room.currentTrick.length === 3 && playedCard.suit === 'spades') {
  //   // Special spades rule
  // }
}

/**
 * MAIN GAME RULES CONFIGURATION
 * This is the main configuration object used by the game server
 */
export const GAME_RULES: GameRules = {
  maxPlayers: 4,
  cardsPerPlayer: 13,

  isValidPlay: isValidCardPlay,
  findTrickWinner: findTrickWinner,
  getNextPlayer: getNextPlayerIndex,
  shouldCollectCards: shouldPlayerCollectCards,
  isGameOver: checkGameOver,
  findWinner: findGameWinner,
  findLoser: findGameLoser,
};

/**
 * ALTERNATIVE RULE SETS
 * You can create different rule configurations here
 */
export const ALTERNATIVE_RULES = {
  // Speed variant - fewer cards per player
  SPEED_GAME: {
    ...GAME_RULES,
    cardsPerPlayer: 7,
    maxPlayers: 4,
  },

  // No follow suit - any card can be played anytime
  FREE_PLAY: {
    ...GAME_RULES,
    isValidPlay: () => true,
  },

  // Reverse scoring - try to collect the most cards
  REVERSE_DONKEY: {
    ...GAME_RULES,
    findWinner: (players: Player[]) => {
      const maxCollected = Math.max(...players.map((p) => p.collectedCards));
      return players.find((p) => p.collectedCards === maxCollected)?.id;
    },
    findLoser: (players: Player[]) => {
      return players.find((p) => p.cardCount === 0)?.id;
    },
  },
};
