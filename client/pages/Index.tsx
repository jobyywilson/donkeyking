import { useState, useEffect, useCallback } from "react";
import { PlayingCard, Card, Suit, Rank } from "@/components/PlayingCard";
import { GameStats } from "@/components/GameStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shuffle, RotateCcw, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const ranks: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7"];

function createDeck(): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < 8; i++) {
    const suit = suits[i % 4];
    const rank = ranks[i];
    cards.push({ suit, rank, faceUp: false });
    cards.push({ suit, rank, faceUp: false });
  }
  return shuffleArray(cards);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Index() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const totalPairs = 8;

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && !gameWon) {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, gameWon]);

  useEffect(() => {
    if (matchedPairs.size === totalPairs) {
      setGameWon(true);
      setIsGameActive(false);
      const timeBonus = Math.max(0, 300 - gameTime);
      const moveBonus = Math.max(0, (50 - moves) * 10);
      setScore((prev) => prev + timeBonus + moveBonus);
    }
  }, [matchedPairs.size, totalPairs, gameTime, moves]);

  const initializeGame = useCallback(() => {
    const newCards = createDeck();
    setCards(newCards);
    setFlippedIndices([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setScore(0);
    setGameTime(0);
    setIsGameActive(false);
    setGameWon(false);
  }, []);

  const handleCardClick = useCallback(
    (index: number) => {
      if (
        flippedIndices.length >= 2 ||
        flippedIndices.includes(index) ||
        cards[index].faceUp ||
        gameWon
      ) {
        return;
      }

      if (!isGameActive) {
        setIsGameActive(true);
      }

      const newFlippedIndices = [...flippedIndices, index];
      setFlippedIndices(newFlippedIndices);

      setCards((prev) =>
        prev.map((card, i) => (i === index ? { ...card, faceUp: true } : card)),
      );

      if (newFlippedIndices.length === 2) {
        setMoves((prev) => prev + 1);

        const [firstIndex, secondIndex] = newFlippedIndices;
        const firstCard = cards[firstIndex];
        const secondCard = cards[secondIndex];

        if (firstCard.rank === secondCard.rank) {
          const pairKey = `${firstCard.rank}-${firstCard.suit}`;
          setMatchedPairs((prev) => new Set([...prev, pairKey]));
          setScore((prev) => prev + 100);
          setFlippedIndices([]);
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((card, i) =>
                i === firstIndex || i === secondIndex
                  ? { ...card, faceUp: false }
                  : card,
              ),
            );
            setFlippedIndices([]);
          }, 1000);
        }
      }
    },
    [flippedIndices, cards, isGameActive, gameWon],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Memory Cards
            </h1>
            <div className="p-3 rounded-full bg-accent/10">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flip cards to find matching pairs. Test your memory and speed!
          </p>
          {gameWon && (
            <Badge className="mt-4 text-lg px-4 py-2 bg-accent text-accent-foreground">
              🎉 Congratulations! You won! 🎉
            </Badge>
          )}
        </div>

        {/* Game Stats */}
        <GameStats
          score={score}
          moves={moves}
          time={formatTime(gameTime)}
          matches={matchedPairs.size}
          totalPairs={totalPairs}
        />

        {/* Control Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button
            onClick={initializeGame}
            variant="outline"
            size="lg"
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            New Game
          </Button>
          <Button
            onClick={() => {
              setCards(shuffleArray([...cards]));
            }}
            variant="outline"
            size="lg"
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
            disabled={isGameActive && !gameWon}
          >
            <Shuffle className="w-5 h-5 mr-2" />
            Shuffle
          </Button>
        </div>

        {/* Game Board */}
        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl">
            {cards.map((card, index) => {
              const isMatched = matchedPairs.has(`${card.rank}-${card.suit}`);
              return (
                <PlayingCard
                  key={index}
                  card={{
                    ...card,
                    faceUp: card.faceUp || isMatched,
                  }}
                  onClick={() => handleCardClick(index)}
                  size="lg"
                  className={cn(
                    isMatched && "opacity-75 cursor-default",
                    "transition-all duration-300",
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Game Instructions */}
        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto border border-white/20">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              How to Play
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">1.</span>
                <span>Click any card to flip it over</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">2.</span>
                <span>Click a second card to find a match</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">3.</span>
                <span>Match all pairs to win the game</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">4.</span>
                <span>Try to win with fewer moves!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
