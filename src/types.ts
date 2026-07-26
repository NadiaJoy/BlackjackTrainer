export type Suit = "♠" | "♥" | "♦" | "♣";
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

export interface PlayingCard {
  rank: Rank;
  suit: Suit;
  value: number;
}

export type CountingSystem = "high-low" | "omega-2";

export interface GameSettings {
  numDecks: number;
  cutCards: number;
  countingSystem: CountingSystem;
  activePositions: number[];
  autoAdvance: boolean;
  dealerHitsSoft17: boolean;
  maxSplitHands: number;
}

export type HandStatus = "playing" | "stood" | "bust" | "blackjack";

export type RoundPhase =
  | "idle"
  | "player-turn"
  | "dealer-turn"
  | "counting"
  | "result";

export interface PlayerHand {
  cards: PlayingCard[];
  status: HandStatus;
  doubled: boolean;
  // A hand that resulted from splitting a pair of Aces: gets exactly one
  // card and can no longer hit, double, or (re)split, even if the drawn
  // card is another Ace.
  isSplitAce: boolean;
}

export interface HandLocation {
  box: number;
  hand: number;
}

export interface GameState {
  shoe: PlayingCard[];
  dealtCards: PlayingCard[];
  currentRound: number;
  playerCount: number;
  actualCount: number;
  gameStarted: boolean;
  phase: RoundPhase;
  activeBoxIndex: number | null;
  activeHandIndex: number | null;
  playerInput: string;
  score: { correct: number; total: number };
  showSettings: boolean;
  showHistory: boolean;
  showHelp: boolean;
  // Mobile-only slide-in drawer for the utility buttons (Settings/History/
  // Help/New Game) during an active game — on larger screens those stay
  // inline instead, see the controls row in the render.
  showMenu: boolean;
  // Player-requested reveal of the real running count, shown next to the
  // dealer. Hidden again at the start of every new round.
  showCount: boolean;
  hands: PlayerHand[][];
  dealerHand: PlayingCard[];
  dealerHoleHidden: boolean;
  notice: string | null;
}

export interface SessionRecord {
  date: string;
  countingSystem: CountingSystem;
  numDecks: number;
  rounds: number;
  correct: number;
  total: number;
}
