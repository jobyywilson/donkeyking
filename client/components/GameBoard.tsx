import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayingCard } from "@/components/PlayingCard";
import { Card as GameCard, GameState } from "@shared/game";
import { Users, Crown, ArrowRight, Hand } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Indian Donkey
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Room: {room.id}</Badge>
              <Badge
                variant={canPass ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                <Hand className="w-3 h-3" />
                {canPass ? "Your Turn" : `${currentPlayer.name}'s Turn`}
              </Badge>
            </div>
          </div>

          <Button
            onClick={onLeaveRoom}
            variant="destructive"
            className="mt-4 lg:mt-0"
          >
            Leave Game
          </Button>
        </div>

        {/* Players Bar */}
        <Card className="p-4 mb-6 bg-white/90 backdrop-blur-sm">
          <div className="flex flex-wrap gap-4 justify-center">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border",
                  player.isCurrentTurn
                    ? "bg-primary/20 border-primary"
                    : "bg-gray-50 border-gray-200",
                  player.id === myId && "ring-2 ring-offset-2 ring-accent",
                )}
              >
                {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                <span className="font-medium">{player.name}</span>
                <Badge variant="outline">{player.cardCount} cards</Badge>
                {player.sets.length > 0 && (
                  <Badge variant="secondary">{player.sets.length} sets</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        {canPass && (
          <Card className="p-4 mb-6 bg-white/90 backdrop-blur-sm">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={handlePassCard}
                disabled={selectedCards.length !== 1}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Pass Card to {getNextPlayerName()}
              </Button>

              <Button
                onClick={handleMakeSet}
                disabled={selectedCards.length !== 4}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Make Set (4 cards)
              </Button>
            </div>

            {selectedCards.length > 0 && (
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {selectedCards.length} card(s) selected
              </div>
            )}
          </Card>
        )}

        {/* My Cards */}
        <Card className="p-6 bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hand className="w-5 h-5" />
            My Cards ({myCards.length})
          </h3>

          {myCards.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {myCards.map((card) => (
                <PlayingCard
                  key={card.id}
                  card={{
                    ...card,
                    faceUp: true,
                    selected: selectedCards.includes(card.id),
                  }}
                  onClick={() => handleCardClick(card.id)}
                  size="md"
                  className={cn(
                    "transition-all duration-200",
                    selectedCards.includes(card.id) &&
                      "ring-2 ring-primary ring-offset-2 scale-105",
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Hand className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No cards remaining!</p>
              <p>Wait for the game to finish...</p>
            </div>
          )}
        </Card>

        {/* Game Instructions */}
        <div className="mt-8 text-center">
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Quick Help
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <div>• Select cards by clicking them</div>
                <div>• Pass 1 card on your turn</div>
              </div>
              <div className="space-y-2">
                <div>• Make sets of 4 same-rank cards</div>
                <div>• First to empty hand wins!</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
