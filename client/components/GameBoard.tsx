import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayingCard } from "@/components/PlayingCard";
import { Card as GameCard, GameState } from "@shared/game";
import { Crown, Hand, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  gameState: GameState;
  onPlayCard: (cardId: string) => void;
  onLeaveRoom: () => void;
}

export function GameBoard({
  gameState,
  onPlayCard,
  onLeaveRoom,
}: GameBoardProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const { room, myCards, myId } = gameState;
  const myPlayer = room.players.find((p) => p.id === myId);
  const currentPlayer = room.players[room.currentPlayerIndex];

  // Group cards by suit for easier selection
  const groupedCards = myCards.reduce(
    (groups, card) => {
      if (!groups[card.suit]) groups[card.suit] = [];
      groups[card.suit].push(card);
      return groups;
    },
    {} as Record<string, GameCard[]>,
  );

  // Sort cards within each suit by rank
  const suitOrder = ["spades", "hearts", "diamonds", "clubs"];
  const rankOrder = [
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

  Object.keys(groupedCards).forEach((suit) => {
    groupedCards[suit].sort(
      (a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank),
    );
  });

  const handleCardClick = (cardId: string) => {
    if (!myPlayer?.isCurrentTurn) return;

    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  const handlePlayCard = () => {
    if (selectedCard && myPlayer?.isCurrentTurn) {
      onPlayCard(selectedCard);
      setSelectedCard(null);
    }
  };

  const handleCardDrop = (cardId: string) => {
    if (myPlayer?.isCurrentTurn) {
      onPlayCard(cardId);
      setSelectedCard(null);
    }
  };

  return (
    <div className="min-h-screen bg-green-800 relative overflow-hidden">
      {/* Felt texture pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-900"></div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: "30px 30px",
        }}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Top Header with Leave Button */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-black/20 text-white border-white/30 backdrop-blur-sm"
            >
              Room: {room.id}
            </Badge>
            <Badge
              className={cn(
                "flex items-center gap-1 backdrop-blur-sm",
                myPlayer?.isCurrentTurn
                  ? "bg-yellow-500 text-black font-bold animate-pulse"
                  : "bg-black/20 text-white border-white/30",
              )}
            >
              <Hand className="w-3 h-3" />
              {myPlayer?.isCurrentTurn
                ? "Your Turn"
                : `${currentPlayer?.displayName || currentPlayer?.name || "Unknown"}'s Turn`}
            </Badge>
          </div>

          <Button
            onClick={onLeaveRoom}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6"
          >
            Leave Game
          </Button>
        </div>

        {/* Player Avatars with Card Zones Below */}
        <div className="flex justify-center gap-12 mb-6 px-4">
          {room.players.map((player, playerIndex) => {
            // Find cards played by this player in current trick
            const playerCards = room.currentTrick.filter((card, cardIndex) => {
              const playOrderIndex =
                (room.trickStartPlayer + cardIndex) % room.players.length;
              return playOrderIndex === playerIndex;
            });

            return (
              <div
                key={player.id}
                className={cn(
                  "flex flex-col items-center gap-3 transition-all duration-300",
                  player.isCurrentTurn && "scale-105",
                )}
              >
                {/* Player Avatar Circle */}
                <div
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 shadow-lg transition-all duration-300",
                    player.isCurrentTurn
                      ? "bg-yellow-500 border-yellow-300 text-black shadow-yellow-300/50"
                      : "bg-blue-600 border-blue-400 shadow-blue-600/30",
                    player.id === myId &&
                      "ring-4 ring-purple-400 ring-offset-4 ring-offset-transparent",
                    player.isFinished &&
                      "bg-gray-500 border-gray-400 opacity-75",
                  )}
                >
                  {(player.displayName || player.name || "?")[0].toUpperCase()}
                </div>

                {/* Player Name and Info */}
                <div className="text-center">
                  <div className="text-white font-bold text-sm flex items-center justify-center gap-1">
                    {player.displayName || player.name}
                    {player.isHost && (
                      <Crown className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex gap-1 justify-center mt-1">
                    <Badge
                      variant="outline"
                      className="bg-black/30 text-white border-white/40 text-xs px-2 py-0"
                    >
                      {player.cardCount}
                    </Badge>
                    {player.isFinished && player.finishPosition && (
                      <Badge
                        className={cn(
                          "font-bold text-xs px-2 py-0",
                          player.finishPosition === 1 &&
                            "bg-yellow-500 text-black",
                          player.finishPosition === 2 &&
                            "bg-gray-400 text-white",
                          player.finishPosition === 3 &&
                            "bg-amber-600 text-white",
                          player.finishPosition > 3 && "bg-blue-500 text-white",
                        )}
                      >
                        {player.finishPosition === 1
                          ? "🏆"
                          : player.finishPosition === 2
                            ? "🥈"
                            : player.finishPosition === 3
                              ? "🥉"
                              : player.finishPosition}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Player Card Zone - Below Avatar */}
                <div
                  className={cn(
                    "w-24 h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300",
                    player.isCurrentTurn
                      ? "border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20"
                      : "border-white/20 bg-white/5",
                  )}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cardId = e.dataTransfer.getData("text/plain");
                    if (cardId && myPlayer?.isCurrentTurn)
                      handleCardDrop(cardId);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {/* Card or Empty State */}
                  {playerCards.length > 0 ? (
                    <div className="relative">
                      {playerCards.map((card) => (
                        <PlayingCard
                          key={card.id}
                          card={{ ...card, faceUp: true }}
                          size="sm"
                          className="border border-white/20"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 text-xs">
                      {player.isCurrentTurn && myPlayer?.id === player.id ? (
                        <>
                          <Hand className="w-6 h-6 mx-auto mb-1" />
                          <p>Play</p>
                        </>
                      ) : (
                        <p>Wait</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Game Info */}
        <div className="flex justify-center mb-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
            <p className="text-white text-sm font-semibold text-center">
              Trick {room.currentTrick.length}/4
            </p>
            {room.trickLeadSuit && (
              <p className="text-yellow-300 text-lg mt-1 text-center">
                Lead:{" "}
                {room.trickLeadSuit === "hearts"
                  ? "♥️"
                  : room.trickLeadSuit === "diamonds"
                    ? "♦️"
                    : room.trickLeadSuit === "clubs"
                      ? "♣️"
                      : "♠️"}
              </p>
            )}
          </div>
        </div>

        {/* Player Hand - Grouped by Suits */}
        <div className="bg-gradient-to-t from-black/40 to-transparent pt-8 pb-6">
          {/* Action Button */}
          {myPlayer?.isCurrentTurn && selectedCard && (
            <div className="flex justify-center mb-6">
              <Button
                onClick={handlePlayCard}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 rounded-2xl shadow-lg text-lg border-2 border-yellow-300 transform hover:scale-105 transition-all duration-200"
              >
                <ArrowRight className="w-6 h-6 mr-2" />
                Play Selected Card
              </Button>
            </div>
          )}

          {/* My Cards - Grouped by Suits */}
          <div className="mx-4">
            {myCards.length > 0 ? (
              <div className="space-y-4">
                {suitOrder.map((suit) => {
                  const suitCards = groupedCards[suit];
                  if (!suitCards || suitCards.length === 0) return null;

                  const suitSymbols = {
                    hearts: "♥️",
                    diamonds: "♦️",
                    clubs: "♣️",
                    spades: "♠️",
                  };

                  return (
                    <div
                      key={suit}
                      className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-white text-lg">
                          {suitSymbols[suit as keyof typeof suitSymbols]}
                        </span>
                        <span className="text-white/80 text-sm font-semibold capitalize">
                          {suit}
                        </span>
                        <span className="text-white/60 text-xs">
                          ({suitCards.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {suitCards.map((card) => (
                          <div
                            key={card.id}
                            className={cn(
                              "transition-all duration-300 cursor-pointer",
                              selectedCard === card.id &&
                                "scale-110 -translate-y-2",
                              myPlayer?.isCurrentTurn
                                ? "hover:scale-105 hover:-translate-y-1"
                                : "opacity-60",
                            )}
                            draggable={myPlayer?.isCurrentTurn}
                            onDragStart={(e) => {
                              if (myPlayer?.isCurrentTurn) {
                                e.dataTransfer.setData("text/plain", card.id);
                              }
                            }}
                          >
                            <PlayingCard
                              card={{
                                ...card,
                                faceUp: true,
                                selected: selectedCard === card.id,
                              }}
                              onClick={() => handleCardClick(card.id)}
                              size="sm"
                              className={cn(
                                "transition-all duration-300 border border-white/20",
                                selectedCard === card.id &&
                                  "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent border-yellow-400",
                                myPlayer?.isCurrentTurn &&
                                  "hover:border-yellow-300",
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 mx-auto max-w-sm border border-white/20">
                  <Hand className="w-16 h-16 mx-auto mb-4 text-white/60" />
                  <p className="text-white font-bold text-xl">
                    No cards remaining!
                  </p>
                  <p className="text-white/80 text-sm mt-2">
                    Waiting for game to finish...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom spacing */}
          <div className="mt-8" />
        </div>
      </div>
    </div>
  );
}
