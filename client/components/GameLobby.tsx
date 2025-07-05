import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Crown, Check, Clock } from "lucide-react";
import { GameState } from "@shared/game";
import { cn } from "@/lib/utils";

interface GameLobbyProps {
  gameState: GameState;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function GameLobby({
  gameState,
  onStartGame,
  onLeaveRoom,
}: GameLobbyProps) {
  const [copied, setCopied] = useState(false);
  const { room, myId } = gameState;
  const myPlayer = room.players.find((p) => p.id === myId);
  const isHost = myPlayer?.isHost;
  const canStart = isHost && room.players.length === 4;

  const copyRoomLink = async () => {
    const link = `${window.location.origin}/?room=${room.id}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Room Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Indian Donkey
        </h1>
        <p className="text-muted-foreground text-lg">
          Waiting for players to join...
        </p>
      </div>

      {/* Room Info */}
      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Room: {room.id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyRoomLink}
              className="flex items-center gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Share Link"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("Header leave room clicked");
                onLeaveRoom();
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              ✕ Leave
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Share this room code or link with friends to play together
        </div>
      </Card>

      {/* Players List */}
      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Players ({room.players.length}/{room.maxPlayers})
        </h3>

        <div className="grid gap-3">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                player.id === myId
                  ? "bg-primary/10 border-primary"
                  : "bg-gray-50 border-gray-200",
              )}
            >
              <div className="flex items-center gap-3">
                {player.isHost && <Crown className="w-5 h-5 text-yellow-500" />}
                <span className="font-medium">{player.name}</span>
                {player.id === myId && <Badge variant="secondary">You</Badge>}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  <Check className="w-3 h-3 mr-1" />
                  Joined
                </Badge>
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map(
            (_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500"
              >
                Waiting for player...
              </div>
            ),
          )}
        </div>
      </Card>

      {/* Game Rules */}
      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-4">How to Play</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Each player gets cards from a shuffled deck</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Make sets of 4 cards with the same rank</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Pass unwanted cards to the next player</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              <span>First to get rid of all cards wins!</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {isHost && (
          <Button
            onClick={onStartGame}
            disabled={!canStart}
            size="lg"
            className="flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Start Game
          </Button>
        )}

        <Button
          onClick={() => {
            console.log("Leave room clicked");
            onLeaveRoom();
          }}
          variant="destructive"
          size="lg"
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white border-2 border-red-400"
        >
          🚪 Leave Room
        </Button>
      </div>

      {!canStart && isHost && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Need exactly 4 players to start the game ({room.players.length}/4
            joined)
          </p>
        </div>
      )}
    </div>
  );
}
