import { useGameSocket } from "@/hooks/useGameSocket";
import { HomePage } from "@/components/HomePage";
import { GameLobby } from "@/components/GameLobby";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card } from "@/components/ui/card";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";

export default function Index() {
  const {
    gameState,
    isConnected,
    error,
    createRoom,
    joinRoom,
    startGame,
    passCards,
    makeSet,
    leaveRoom,
  } = useGameSocket();

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="fixed top-4 right-4 z-50">
      <Card className="p-2 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">Disconnected</span>
            </>
          )}
        </div>
      </Card>
    </div>
  );

  // Loading/Error states
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-white/90 backdrop-blur-sm">
          <WifiOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Connecting to Game Server...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we establish connection
          </p>
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 justify-center">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const handlePlayAgain = () => {
    // Reset to lobby state to start a new game
    if (
      gameState?.room?.players?.find((p) => p.id === gameState.myId)?.isHost
    ) {
      // Host can start new game in same room
      window.location.reload();
    } else {
      // Non-host players go back to home
      leaveRoom();
    }
  };

  const handleGoHome = () => {
    leaveRoom();
  };

  // Render appropriate component based on game state
  const renderGameState = () => {
    if (!gameState || !gameState.room) {
      return (
        <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
        />
      );
    }

    switch (gameState.room.gameState) {
      case "waiting":
        return (
          <GameLobby
            gameState={gameState}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
          />
        );

      case "playing":
        return (
          <GameBoard
            gameState={gameState}
            onPassCards={passCards}
            onMakeSet={makeSet}
            onLeaveRoom={leaveRoom}
          />
        );

      case "finished":
        return (
          <GameOver
            gameState={gameState}
            onPlayAgain={handlePlayAgain}
            onGoHome={handleGoHome}
          />
        );

      default:
        return (
          <HomePage
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            error={error}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <ConnectionStatus />
      {renderGameState()}
    </ErrorBoundary>
  );
}
