import type { PlayingCard } from "../types";

const Card = ({
  card,
  hidden = false,
}: {
  card: PlayingCard;
  hidden?: boolean;
}) => {
  if (hidden) {
    return (
      <div className="w-12 h-16 bg-blue-600 border border-gray-400 rounded-lg flex items-center justify-center text-white text-xs font-bold">
        ?
      </div>
    );
  }

  const isRed = ["♥", "♦"].includes(card.suit);
  return (
    <div
      className={`w-12 h-16 bg-white border border-gray-400 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
        isRed ? "text-red-600" : "text-black"
      }`}
    >
      <div>{card.rank}</div>
      <div>{card.suit}</div>
    </div>
  );
};

export default Card;
