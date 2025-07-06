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

  const handleCardClick = (cardId: string) => {
    if (!myPlayer?.isCurrentTurn) return;

    if (selectedCard === cardId) {
      // Deselect if clicking the same card
      setSelectedCard(null);
    } else {
      // Select the card
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

        {/* Player Avatars at Top */}
        <div className="flex justify-center gap-12 mb-8 px-4">
          {room.players.map((player, index) => (
            <div
              key={player.id}
              className={cn(
                "flex flex-col items-center gap-2 transition-all duration-300",
                player.isCurrentTurn && "scale-110",
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
                  player.isFinished && "bg-gray-500 border-gray-400 opacity-75",
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
                        player.finishPosition === 2 && "bg-gray-400 text-white",
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
            </div>
          ))}
        </div>

        {/* Center Play Area */}
        <div className="flex-1 flex flex-col justify-center items-center px-4">
          {/* Current Trick Cards - Horizontal Layout */}
          <div className="flex justify-center items-center gap-6 mb-8 min-h-[160px]">
            {room.currentTrick && room.currentTrick.length > 0 ? (
              room.currentTrick.map((card, index) => (
                <div
                  key={card.id}
                  className="transform transition-all duration-500 hover:scale-105"
                  style={{
                    zIndex: index + 1,
                    filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
                  }}
                >
                  <PlayingCard
                    card={{ ...card, faceUp: true }}
                    size="lg"
                    className="border-2 border-white/20"
                  />
                </div>
              ))
            ) : (
              /* Empty Play Area - Drop Zone */
              <div
                className={cn(
                  "w-40 h-56 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300",
                  myPlayer?.isCurrentTurn
                    ? "border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20 animate-pulse"
                    : "border-white/20 bg-white/5",
                )}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData("text/plain");
                  if (cardId) handleCardDrop(cardId);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {myPlayer?.isCurrentTurn ? (
                  <div className="text-yellow-300">
                    <Hand className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-lg font-bold">Play Card</p>
                    <p className="text-sm opacity-80">Drag or Click</p>
                  </div>
                ) : (
                  <div className="text-white/40">
                    <p className="text-sm">Waiting...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lead Suit Indicator */}
          {room.trickLeadSuit && (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl px-6 py-3 mb-6 border border-white/20">
              <p className="text-white text-center font-semibold">
                Lead Suit:{" "}
                <span className="text-yellow-300 text-xl ml-2">
                  {room.trickLeadSuit === "hearts"
                    ? "♥️"
                    : room.trickLeadSuit === "diamonds"
                      ? "♦️"
                      : room.trickLeadSuit === "clubs"
                        ? "♣️"
                        : "♠️"}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Player Hand - Fanned Cards at Bottom */}
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

          {/* My Cards - Fanned Layout */}
          <div className="relative h-36 mx-4">
            {myCards.length > 0 ? (
              <div className="relative flex justify-center">
                {myCards.map((card, index) => {
                  const totalCards = myCards.length;
                  const maxSpread = Math.min(totalCards * 25, 400); // Max spread width
                  const cardSpacing =
                    totalCards > 1 ? maxSpread / (totalCards - 1) : 0;
                  const xPosition =
                    totalCards > 1 ? index * cardSpacing - maxSpread / 2 : 0;
                  const rotation =
                    totalCards > 1 ? (index / (totalCards - 1) - 0.5) * 45 : 0; // Fan effect
                  const yOffset = Math.abs(rotation) * 0.8; // Slight arc effect

                  return (
                    <div
                      key={card.id}
                      className={cn(
                        "absolute transition-all duration-300 cursor-pointer",
                        selectedCard === card.id &&
                          "z-40 scale-110 -translate-y-12",
                        myPlayer?.isCurrentTurn
                          ? "hover:z-30 hover:scale-105 hover:-translate-y-6"
                          : "opacity-60",
                      )}
                      style={{
                        left: `calc(50% + ${xPosition}px)`,
                        transform: `translateX(-50%) translateY(${selectedCard === card.id ? -20 : yOffset}px) rotate(${rotation}deg)`,
                        zIndex: selectedCard === card.id ? 40 : 10 + index,
                        filter:
                          selectedCard === card.id
                            ? "drop-shadow(0 20px 40px rgba(255,255,0,0.3))"
                            : "drop-shadow(0 8px 16px rgba(0,0,0,0.3))",
                      }}
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
                        size="md"
                        className={cn(
                          "transition-all duration-300 border border-white/20",
                          selectedCard === card.id &&
                            "ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent border-yellow-400",
                          myPlayer?.isCurrentTurn && "hover:border-yellow-300",
                        )}
                      />
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

          {/* Fast-Paced Gameplay Text */}
          <div className="text-center mt-8">
            <p
              className="text-yellow-400 font-black text-2xl tracking-widest uppercase"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
            >
              FAST-PACED GAMEPLAY!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
