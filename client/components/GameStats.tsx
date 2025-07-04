import { Card } from "@/components/ui/card";

interface GameStatsProps {
  score: number;
  moves: number;
  time: string;
  matches: number;
  totalPairs: number;
}

export function GameStats({
  score,
  moves,
  time,
  matches,
  totalPairs,
}: GameStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="p-4 text-center bg-white/90 backdrop-blur-sm">
        <div className="text-2xl font-bold text-primary">{score}</div>
        <div className="text-sm text-muted-foreground">Score</div>
      </Card>

      <Card className="p-4 text-center bg-white/90 backdrop-blur-sm">
        <div className="text-2xl font-bold text-secondary-foreground">
          {moves}
        </div>
        <div className="text-sm text-muted-foreground">Moves</div>
      </Card>

      <Card className="p-4 text-center bg-white/90 backdrop-blur-sm">
        <div className="text-2xl font-bold text-accent-foreground">{time}</div>
        <div className="text-sm text-muted-foreground">Time</div>
      </Card>

      <Card className="p-4 text-center bg-white/90 backdrop-blur-sm">
        <div className="text-2xl font-bold text-green-600">{matches}</div>
        <div className="text-sm text-muted-foreground">Matches</div>
      </Card>

      <Card className="p-4 text-center bg-white/90 backdrop-blur-sm">
        <div className="text-2xl font-bold text-purple-600">
          {Math.round((matches / totalPairs) * 100)}%
        </div>
        <div className="text-sm text-muted-foreground">Complete</div>
      </Card>
    </div>
  );
}
