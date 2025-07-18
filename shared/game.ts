export interface Player {
  id: string;
  name: string; // Original name entered by player
  displayName: string; // Name shown in UI (with unique suffix if needed)
  cardCount: number;
  isReady: boolean;
  isHost: boolean;
  isCurrentTurn: boolean;
  sets: Card[][];
  isConnected: boolean;
  collectedCards: number; // Number of cards collected from tricks
  finishPosition?: number; // 1st, 2nd, 3rd place (undefined = still playing)
  isFinished: boolean; // True when player has no cards left
}

export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank:
    | "A"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10"
    | "J"
    | "Q"
    | "K";
  id: string;
}

export interface GameRoom {
  id: string;
  players: Player[];
  gameState: "waiting" | "playing" | "finished";
  currentPlayerIndex: number;
  winner?: string; // First place winner
  donkey?: string; // Last player with cards
  maxPlayers: number;
  createdAt: Date;
  centerCards: Card[];
  currentTrick: Card[];
  trickLeadSuit?: "hearts" | "diamonds" | "clubs" | "spades";
  trickStartPlayer: number;
  finishedPlayers: number; // Count of players who finished
}

export interface GameState {
  room: GameRoom;
  myCards: Card[];
  myId: string;
  selectedCards: string[];
  canPass: boolean;
  passDirection: "left" | "right";
}

export type SocketEvent =
  | { type: "JOIN_ROOM"; payload: { roomId: string; playerName: string } }
  | { type: "CREATE_ROOM"; payload: { playerName: string } }
  | { type: "READY_UP"; payload: {} }
  | { type: "START_GAME"; payload: {} }
  | { type: "PLAY_CARD"; payload: { cardId: string } }
  | { type: "PASS_CARDS"; payload: { cardIds: string[] } }
  | { type: "MAKE_SET"; payload: { cardIds: string[] } }
  | { type: "LEAVE_ROOM"; payload: {} };

export type SocketResponse =
  | { type: "ROOM_JOINED"; payload: GameState }
  | { type: "ROOM_CREATED"; payload: { roomId: string; gameState: GameState } }
  | { type: "PLAYER_JOINED"; payload: { player: Player } }
  | { type: "PLAYER_LEFT"; payload: { playerId: string } }
  | { type: "GAME_STARTED"; payload: GameState }
  | { type: "GAME_STATE_UPDATE"; payload: GameState }
  | { type: "TURN_CHANGED"; payload: { currentPlayerId: string } }
  | { type: "GAME_FINISHED"; payload: { winner: string; donkey: string } }
  | { type: "ERROR"; payload: { message: string } };
