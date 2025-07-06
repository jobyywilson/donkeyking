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
  const players = room.players;
  let nextIndex = (currentIndex + 1) % players.length;

  // Skip finished players (those with no cards)
  let attempts = 0;
  while (players[nextIndex].isFinished && attempts < players.length) {
    nextIndex = (nextIndex + 1) % players.length;
    attempts++;
  }

  // If all remaining players are finished, return current index
  return attempts >= players.length ? currentIndex : nextIndex;
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
export function findTrickWinner(trick: Card[], leadSuit?: string): Card | null {
  if (trick.length === 0) {
    return null;
  }

  // Special rule: If all 4 players play the same rank, cards are "bent" (no winner)
  if (trick.length === 4) {
    const ranks = trick.map((card) => card.rank);
    const uniqueRanks = new Set(ranks);

    if (uniqueRanks.size === 1) {
      console.log(
        `All players played ${ranks[0]} - cards are bent and removed!`,
      );
      return null; // No winner, cards are bent/removed
    }
  }

  if (!leadSuit) {
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
  // Special rule: If all 4 players play the same rank, nobody collects
  if (trick.length === 4) {
    const ranks = trick.map((card) => card.rank);
    const uniqueRanks = new Set(ranks);

    if (uniqueRanks.size === 1) {
      return false; // Cards are bent/removed, nobody collects
    }
  }

  // Otherwise, winner always collects all cards from the trick
  return true;
}

/**
 * WIN/LOSE CONDITIONS
 * Define how the game ends and who wins/loses
 */
export function checkGameOver(players: Player[]): boolean {
  // Game ends only when only ONE player has cards left (the donkey)
  const playersWithCards = players.filter((player) => player.cardCount > 0);
  return playersWithCards.length <= 1;
}

export function findGameWinner(players: Player[]): string | undefined {
  // Winner is the first player who finished (finishPosition = 1)
  const winner = players.find((player) => player.finishPosition === 1);
  return winner?.id;
}

export function findGameLoser(players: Player[]): string | undefined {
  // Loser (Donkey) is the last player who still has cards
  const playersWithCards = players.filter((player) => player.cardCount > 0);
  return playersWithCards.length === 1 ? playersWithCards[0].id : undefined;
}

/**
 * PLAYER FINISHING LOGIC
 * Handle when a player runs out of cards
 */
export function handlePlayerFinish(
  players: Player[],
  finishedPlayerId: string,
): number {
  const finishedPlayer = players.find((p) => p.id === finishedPlayerId);
  if (!finishedPlayer) return 0;

  // Calculate finish position (1st, 2nd, 3rd, etc.)
  const currentFinishedCount = players.filter((p) => p.isFinished).length;
  const position = currentFinishedCount + 1;

  // Update player status
  finishedPlayer.isFinished = true;
  finishedPlayer.finishPosition = position;

  console.log(
    `${finishedPlayer.displayName} finished in position ${position}!`,
  );
  return position;
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
