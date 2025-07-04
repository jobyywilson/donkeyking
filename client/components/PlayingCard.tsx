import { cn } from "@/lib/utils";

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
  selected?: boolean;
}

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

const suitSymbols: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const suitColors: Record<Suit, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-gray-800",
  spades: "text-gray-800",
};

const cardSizes = {
  sm: "w-12 h-16 text-xs",
  md: "w-16 h-24 text-sm",
  lg: "w-20 h-32 text-base",
};

export function PlayingCard({
  card,
  onClick,
  className,
  size = "md",
  style,
}: PlayingCardProps) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "relative cursor-pointer select-none transition-all duration-300 hover:scale-105",
          cardSizes[size],
          className,
        )}
        onClick={onClick}
        style={style}
      >
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg border border-blue-500 flex items-center justify-center">
          <div className="text-white font-bold text-xs opacity-60">🂠</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative cursor-pointer select-none transition-all duration-300 hover:scale-105",
        cardSizes[size],
        card.selected && "ring-2 ring-accent ring-offset-2",
        className,
      )}
      onClick={onClick}
      style={style}
    >
      <div className="w-full h-full rounded-lg bg-white shadow-lg border border-gray-200 flex flex-col justify-between p-2">
        {/* Top left rank and suit */}
        <div
          className={cn(
            "flex flex-col items-start leading-none",
            suitColors[card.suit],
          )}
        >
          <span className="font-bold">{card.rank}</span>
          <span className="-mt-1">{suitSymbols[card.suit]}</span>
        </div>

        {/* Center suit symbol */}
        <div
          className={cn(
            "flex items-center justify-center",
            suitColors[card.suit],
          )}
        >
          <span className="text-2xl">{suitSymbols[card.suit]}</span>
        </div>

        {/* Bottom right rank and suit (rotated) */}
        <div
          className={cn(
            "flex flex-col items-end leading-none rotate-180",
            suitColors[card.suit],
          )}
        >
          <span className="font-bold">{card.rank}</span>
          <span className="-mt-1">{suitSymbols[card.suit]}</span>
        </div>
      </div>
    </div>
  );
}
