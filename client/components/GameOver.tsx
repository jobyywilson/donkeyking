import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, RotateCcw, Home } from "lucide-react";
import { GameState } from "@shared/game";

interface GameOverProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameOver({ gameState, onPlayAgain, onGoHome }: GameOverProps) {
  const { room, myId } = gameState;
  const winner = room.players.find((p) => p.id === room.winner);
  const donkey = room.players.find((p) => p.id === room.donkey);
  const isWinner = room.winner === myId;
  const isDonkey = room.donkey === myId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Result Card */}
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl text-center">
          <div className="mb-6">
            {isWinner ? (
              <>
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-yellow-600" />
                </div>
                <h1 className="text-4xl font-bold text-green-600 mb-2">
                  🎉 You Won! 🎉
                </h1>
                <p className="text-xl text-muted-foreground">
                  Congratulations! You got rid of all your cards first!
                </p>
              </>
            ) : isDonkey ? (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-red-600 mb-2">
                  🐴 You're the Donkey! 🐴
                </h1>
                <p className="text-xl text-muted-foreground">
                  Better luck next time! You were the last with cards.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-gray-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-700 mb-2">
                  Game Over
                </h1>
                <p className="text-xl text-muted-foreground">
                  Thanks for playing! Check the results below.
                </p>
              </>
            )}
          </div>

          {/* Game Results */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Final Results</h2>

            <div className="space-y-3">
              {/* Winner */}
              {winner && (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-green-800">
                      {winner.displayName}
                    </span>
                  </div>
                  <Badge className="bg-green-500 text-white">Winner!</Badge>
                </div>
              )}

              {/* Other Players */}
              {room.players
                .filter((p) => p.id !== room.winner && p.id !== room.donkey)
                .sort((a, b) => a.cardCount - b.cardCount)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-gray-700">
                        {index + 2}
                      </span>
                      <span className="font-medium">{player.displayName}</span>
                    </div>
                    <Badge variant="outline">
                      {player.cardCount} cards left
                    </Badge>
                  </div>
                ))}

              {/* Donkey */}
              {donkey && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🐴</span>
                    <span className="font-semibold text-red-800">
                      {donkey.displayName}
                    </span>
                  </div>
                  <Badge className="bg-red-500 text-white">Donkey</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onPlayAgain}
              size="lg"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </Button>

            <Button
              onClick={onGoHome}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              New Game
            </Button>
          </div>
        </Card>

        {/* Fun Stats Card */}
        <Card className="mt-6 p-6 bg-white/70 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-center mb-4">
            Game Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {room.players.length}
              </div>
              <div className="text-sm text-muted-foreground">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {room.players.reduce((sum, p) => sum + p.sets.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Sets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {room.players.reduce((sum, p) => sum + p.cardCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Cards Left</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{room.id}</div>
              <div className="text-sm text-muted-foreground">Room Code</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
