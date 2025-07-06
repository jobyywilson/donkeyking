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
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
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
            <h2 className="text-2xl font-semibold mb-4">Final Rankings</h2>

            <div className="space-y-3">
              {/* Show all players in finish order */}
              {room.players
                .filter((p) => p.isFinished)
                .sort(
                  (a, b) =>
                    (a.finishPosition || 999) - (b.finishPosition || 999),
                )
                .map((player) => (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg",
                      player.finishPosition === 1 &&
                        "bg-yellow-50 border-yellow-200",
                      player.finishPosition === 2 &&
                        "bg-gray-50 border-gray-200",
                      player.finishPosition === 3 &&
                        "bg-amber-50 border-amber-200",
                      (player.finishPosition || 0) > 3 &&
                        "bg-blue-50 border-blue-200",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {player.finishPosition === 1 && (
                        <Trophy className="w-6 h-6 text-yellow-600" />
                      )}
                      {player.finishPosition === 2 && (
                        <span className="text-2xl">🥈</span>
                      )}
                      {player.finishPosition === 3 && (
                        <span className="text-2xl">🥉</span>
                      )}
                      {(player.finishPosition || 0) > 3 && (
                        <span className="w-6 h-6 bg-blue-300 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                          {player.finishPosition}
                        </span>
                      )}
                      <span className="font-semibold">
                        {player.displayName}
                      </span>
                    </div>
                    <Badge
                      className={cn(
                        "text-white",
                        player.finishPosition === 1 && "bg-yellow-500",
                        player.finishPosition === 2 && "bg-gray-400",
                        player.finishPosition === 3 && "bg-amber-600",
                        (player.finishPosition || 0) > 3 && "bg-blue-500",
                      )}
                    >
                      {player.finishPosition === 1
                        ? "Winner!"
                        : player.finishPosition === 2
                          ? "2nd Place"
                          : player.finishPosition === 3
                            ? "3rd Place"
                            : `${player.finishPosition}th Place`}
                    </Badge>
                  </div>
                ))}

              {/* Donkey (last player with cards) */}
              {donkey && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🐴</span>
                    <span className="font-semibold text-red-800">
                      {donkey.displayName}
                    </span>
                  </div>
                  <Badge className="bg-red-500 text-white">Donkey 🐴</Badge>
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
