import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogIn, Gamepad2, Crown } from "lucide-react";

interface HomePageProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  error?: string | null;
}

export function HomePage({ onCreateRoom, onJoinRoom, error }: HomePageProps) {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Check if there's a room ID in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get("room");
    if (roomFromUrl) {
      setRoomId(roomFromUrl.toUpperCase());
      setActiveTab("join");
    }
  }, []);

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      onCreateRoom(playerName.trim());
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomId.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            🎴 Indian Donkey 🎴
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            ✨ Fun multiplayer card game for 4 players! ✨
          </p>
          <Badge className="mt-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-lg px-4 py-2 shadow-lg">
            🎯 First to empty your hand wins! 🏆
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl">
          {/* Player Name Input */}
          <div className="mb-6">
            <Label htmlFor="playerName" className="text-base font-medium">
              Your Name
            </Label>
            <Input
              id="playerName"
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-2"
              maxLength={20}
            />
          </div>

          {/* Tab Selection */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "create"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "join"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Join Room
            </button>
          </div>

          {/* Create Room Tab */}
          {activeTab === "create" && (
            <div className="space-y-4">
              <div className="text-center">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold mb-2">Host a New Game</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a room and invite friends to play
                </p>
              </div>

              <Button
                onClick={handleCreateRoom}
                disabled={!playerName.trim()}
                className="w-full"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                You'll get a room code to share with friends
              </div>
            </div>
          )}

          {/* Join Room Tab */}
          {activeTab === "join" && (
            <div className="space-y-4">
              <div className="text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold mb-2">Join a Game</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the room code from your friend
                </p>
              </div>

              <div>
                <Label htmlFor="roomId" className="text-sm font-medium">
                  Room Code
                </Label>
                <Input
                  id="roomId"
                  type="text"
                  placeholder="Enter room code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="mt-2 uppercase"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomId.trim()}
                className="w-full"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Join Room
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}
        </Card>

        {/* Game Features */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <Card className="p-4 bg-white/60 backdrop-blur-sm">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-sm font-medium">2-6 Players</div>
            <div className="text-xs text-muted-foreground">Multiplayer fun</div>
          </Card>
          <Card className="p-4 bg-white/60 backdrop-blur-sm">
            <Gamepad2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-sm font-medium">Turn Based</div>
            <div className="text-xs text-muted-foreground">Strategic play</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
