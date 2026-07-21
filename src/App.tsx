import { useState, useCallback, useEffect } from "react";
import {
  Settings,
  Play,
  RotateCcw,
  History as HistoryIcon,
  HelpCircle,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";
import {
  type Language,
  type Strings,
  STRINGS,
  loadLanguage,
  saveLanguage,
} from "./i18n";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank =
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

interface PlayingCard {
  rank: Rank;
  suit: Suit;
  value: number;
}

type CountingSystem = "high-low" | "omega-2";

interface GameSettings {
  numDecks: number;
  cutCards: number;
  countingSystem: CountingSystem;
  activePositions: number[];
  autoAdvance: boolean;
  dealerHitsSoft17: boolean;
  maxSplitHands: number;
}

type HandStatus = "playing" | "stood" | "bust" | "blackjack";

type RoundPhase = "idle" | "player-turn" | "dealer-turn" | "counting" | "result";

interface PlayerHand {
  cards: PlayingCard[];
  status: HandStatus;
  doubled: boolean;
  // A hand that resulted from splitting a pair of Aces: gets exactly one
  // card and can no longer hit, double, or (re)split, even if the drawn
  // card is another Ace.
  isSplitAce: boolean;
}

interface HandLocation {
  box: number;
  hand: number;
}

interface GameState {
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
  hands: PlayerHand[][];
  dealerHand: PlayingCard[];
  dealerHoleHidden: boolean;
  notice: string | null;
}

interface SessionRecord {
  date: string;
  countingSystem: CountingSystem;
  numDecks: number;
  rounds: number;
  correct: number;
  total: number;
}

// The number of boxes at the table is fixed in the UI (checkboxes "Box
// 1".."Box 6"), so we use it directly as the hands array size instead of
// a separate configurable field that used to be out of sync with the
// checkboxes.
const MAX_BOXES = 6;

const DEFAULT_SETTINGS: GameSettings = {
  numDecks: 6,
  cutCards: 1.5,
  countingSystem: "high-low",
  activePositions: [1, 2, 3],
  autoAdvance: true,
  dealerHitsSoft17: false,
  maxSplitHands: 4,
};

const SETTINGS_KEY = "blackjack-trainer:settings";
const HISTORY_KEY = "blackjack-trainer:history";
const MAX_HISTORY_ENTRIES = 50;

// localStorage may be unavailable (private browsing, etc.) — wrap every
// access in try/catch and silently fall back to defaults instead of
// crashing the app.
const loadSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (settings: GameSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable — just skip saving
  }
};

const loadHistory = (): SessionRecord[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveHistory = (history: SessionRecord[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // storage unavailable — just skip saving
  }
};

const formatSessionDate = (iso: string, language: Language): string => {
  try {
    return new Date(iso).toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

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

const NoticeModal = ({
  message,
  okLabel,
  onClose,
}: {
  message: string;
  okLabel: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-gray-900 text-center">
      <p className="mb-6">{message}</p>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        {okLabel}
      </button>
    </div>
  </div>
);

interface SettingsPanelProps {
  t: Strings;
  initialSettings: GameSettings;
  gameStarted: boolean;
  onApply: (settings: GameSettings) => void;
  onCancel: () => void;
}

const SettingsPanel = ({
  t,
  initialSettings,
  gameStarted,
  onApply,
  onCancel,
}: SettingsPanelProps) => {
  const [draft, setDraft] = useState<GameSettings>(initialSettings);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-gray-900">
        <h3 className="text-xl font-bold mb-4">{t.settingsTitle}</h3>

        {gameStarted && (
          <p className="text-sm text-gray-500 mb-4">{t.settingsLockedNotice}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.numDecksLabel}
            </label>
            <select
              value={draft.numDecks}
              disabled={gameStarted}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  numDecks: parseInt(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value={6}>{t.deckOption6}</option>
              <option value={8}>{t.deckOption8}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.cutCardsLabel}
            </label>
            <select
              value={draft.cutCards}
              disabled={gameStarted}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  cutCards: parseFloat(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value={1.5}>{t.cutOption1_5}</option>
              <option value={2}>{t.cutOption2}</option>
              <option value={3}>{t.cutOption3}</option>
              <option value={4}>{t.cutOption4}</option>
              <option value={5}>{t.cutOption5}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.countingSystemLabel}
            </label>
            <select
              value={draft.countingSystem}
              disabled={gameStarted}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  countingSystem: e.target.value as CountingSystem,
                }))
              }
              className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="high-low">{t.highLowOptionLabel}</option>
              <option value="omega-2">{t.omegaOptionLabel}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.positionsLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: MAX_BOXES }, (_, i) => i + 1).map((pos) => (
                <label key={pos} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={draft.activePositions.includes(pos)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDraft((prev) => ({
                          ...prev,
                          activePositions: [
                            ...prev.activePositions,
                            pos,
                          ].sort((a, b) => a - b),
                        }));
                      } else {
                        setDraft((prev) => ({
                          ...prev,
                          activePositions: prev.activePositions.filter(
                            (p) => p !== pos
                          ),
                        }));
                      }
                    }}
                  />
                  <span>
                    {t.boxLabel} {pos}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={draft.autoAdvance}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    autoAdvance: e.target.checked,
                  }))
                }
              />
              <span className="text-sm font-medium">{t.autoAdvanceLabel}</span>
            </label>
            {!draft.autoAdvance && (
              <p className="text-sm text-gray-500 mt-1">{t.autoAdvanceHint}</p>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={draft.dealerHitsSoft17}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    dealerHitsSoft17: e.target.checked,
                  }))
                }
              />
              <span className="text-sm font-medium">{t.dealerH17Label}</span>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {draft.dealerHitsSoft17 ? t.dealerH17HintOn : t.dealerH17HintOff}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.maxSplitLabel}
            </label>
            <select
              value={draft.maxSplitHands}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  maxSplitHands: parseInt(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value={2}>{t.maxSplitOption2}</option>
              <option value={3}>{t.maxSplitOption3}</option>
              <option value={4}>{t.maxSplitOption4}</option>
              <option value={99}>{t.maxSplitOptionUnlimited}</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">{t.maxSplitHint}</p>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => onApply(draft)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
};

interface HistoryPanelProps {
  t: Strings;
  language: Language;
  history: SessionRecord[];
  onClear: () => void;
  onClose: () => void;
}

const HistoryPanel = ({
  t,
  language,
  history,
  onClear,
  onClose,
}: HistoryPanelProps) => {
  const [confirmingClear, setConfirmingClear] = useState(false);

  const totals = history.reduce(
    (acc, r) => ({ correct: acc.correct + r.correct, total: acc.total + r.total }),
    { correct: 0, total: 0 }
  );
  const overallAccuracy =
    totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-gray-900 max-h-[85vh] flex flex-col">
        <h3 className="text-xl font-bold mb-4">{t.historyTitle}</h3>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">{t.historyEmpty}</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {t.historyAllTimeAccuracyPrefix} {overallAccuracy}% ({history.length}{" "}
              {history.length === 1 ? t.shoeSingular : t.shoePlural})
            </p>
            <div className="overflow-y-auto flex-1 space-y-2 mb-4">
              {history.map((record, idx) => (
                <div
                  key={idx}
                  className="border rounded px-3 py-2 text-sm flex justify-between items-center gap-3"
                >
                  <div>
                    <div className="font-medium">
                      {formatSessionDate(record.date, language)}
                    </div>
                    <div className="text-gray-500">
                      {record.countingSystem.toUpperCase()} · {record.numDecks}{" "}
                      {record.numDecks === 1 ? t.shoeSingular : t.shoePlural} ·{" "}
                      {record.rounds} {t.roundsSuffix}
                    </div>
                  </div>
                  <div className="text-lg font-bold whitespace-nowrap">
                    {Math.round((record.correct / record.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex space-x-4 mt-auto">
          {confirmingClear ? (
            <>
              <button
                onClick={() => setConfirmingClear(false)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onClear();
                  setConfirmingClear(false);
                }}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                {t.confirmClearBtn}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {t.close}
              </button>
              {history.length > 0 && (
                <button
                  onClick={() => setConfirmingClear(true)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  {t.clearHistory}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const HelpPanel = ({ t, onClose }: { t: Strings; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-gray-900 max-h-[85vh] flex flex-col">
      <h3 className="text-xl font-bold mb-4">{t.helpTitle}</h3>
      <div className="overflow-y-auto flex-1 space-y-4 mb-4">
        {t.helpSections.map((section, idx) => (
          <div key={idx}>
            <h4 className="font-bold mb-1">{section.title}</h4>
            <p className="text-sm text-gray-700">{section.body}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {t.close}
      </button>
    </div>
  </div>
);

const langButtonClass = (active: boolean) =>
  `px-3 py-1 rounded text-sm font-semibold ${
    active
      ? "bg-white text-green-800"
      : "bg-green-700 text-green-200 hover:bg-green-600"
  }`;

const BlackjackTrainer = () => {
  const [language, setLanguage] = useState<Language>(loadLanguage);
  const t = STRINGS[language];

  const switchLanguage = (next: Language) => {
    setLanguage(next);
    saveLanguage(next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const [gameSettings, setGameSettings] = useState<GameSettings>(loadSettings);
  const [history, setHistory] = useState<SessionRecord[]>(loadHistory);

  const [gameState, setGameState] = useState<GameState>({
    shoe: [],
    dealtCards: [],
    currentRound: 0,
    playerCount: 0,
    actualCount: 0,
    gameStarted: false,
    phase: "idle",
    activeBoxIndex: null,
    activeHandIndex: null,
    playerInput: "",
    score: { correct: 0, total: 0 },
    showSettings: false,
    showHistory: false,
    showHelp: false,
    showMenu: false,
    hands: [],
    dealerHand: [],
    dealerHoleHidden: true,
    notice: null,
  });

  // Build the deck
  const createDeck = useCallback(() => {
    const suits: Suit[] = ["♠", "♥", "♦", "♣"];
    const ranks: Rank[] = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    const deck: PlayingCard[] = [];

    for (let d = 0; d < gameSettings.numDecks; d++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          deck.push({ rank, suit, value: getCardValue(rank) });
        }
      }
    }
    return shuffleDeck(deck);
  }, [gameSettings.numDecks]);

  const shuffleDeck = (deck: PlayingCard[]): PlayingCard[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getCardValue = (rank: Rank): number => {
    if (rank === "A") return 11;
    if (["J", "Q", "K"].includes(rank)) return 10;
    return parseInt(rank);
  };

  // Counting systems
  const getCountValue = (card: PlayingCard): number => {
    const { rank } = card;

    if (gameSettings.countingSystem === "high-low") {
      if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
      if (["10", "J", "Q", "K", "A"].includes(rank)) return -1;
      return 0;
    }

    if (gameSettings.countingSystem === "omega-2") {
      if (["2", "3", "7"].includes(rank)) return 1;
      if (["4", "5", "6"].includes(rank)) return 2;
      if (["9"].includes(rank)) return -1;
      if (["10", "J", "Q", "K"].includes(rank)) return -2;
      return 0;
    }

    return 0;
  };

  // Hand value + whether it's "soft" (an Ace is still counted as 11)
  const getHandInfo = (hand: PlayingCard[]): { value: number; soft: boolean } => {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.rank === "A") {
        aces++;
        value += 11;
      } else {
        value += card.value;
      }
    }

    let softAces = aces;
    while (value > 21 && softAces > 0) {
      value -= 10;
      softAces--;
    }

    return { value, soft: softAces > 0 };
  };

  const getHandValue = (hand: PlayingCard[]): number => getHandInfo(hand).value;

  const isNaturalBlackjack = (hand: PlayingCard[]): boolean =>
    hand.length === 2 && getHandValue(hand) === 21;

  // Splitting is allowed on equal card VALUE, not rank — e.g. a queen and
  // a king also count as a pair (both worth 10). Ace-split hands can never
  // be split again, even if the drawn card is another Ace.
  const canSplitHand = (hand: PlayerHand, handsInBox: number): boolean =>
    !hand.isSplitAce &&
    hand.cards.length === 2 &&
    hand.cards[0].value === hand.cards[1].value &&
    handsInBox < gameSettings.maxSplitHands;

  // Minimum cards needed to deal another round
  const minCardsForRound = () => (gameSettings.activePositions.length + 1) * 2;

  // Log a completed shoe to history (localStorage) if at least one answer
  // was given. Writes to localStorage synchronously rather than through
  // the functional setHistory — one call site fires right before
  // window.location.reload(), and the state update might not apply before
  // the page reloads.
  const recordSession = (rounds: number, score: { correct: number; total: number }) => {
    if (score.total === 0) return;
    const record: SessionRecord = {
      date: new Date().toISOString(),
      countingSystem: gameSettings.countingSystem,
      numDecks: gameSettings.numDecks,
      rounds,
      correct: score.correct,
      total: score.total,
    };
    const next = [record, ...history].slice(0, MAX_HISTORY_ENTRIES);
    saveHistory(next);
    setHistory(next);
  };

  // Deal the starting cards for one round (pure function, no state access)
  const buildRoundDeal = (shoe: PlayingCard[], dealtCardsSoFar: PlayingCard[]) => {
    let newShoe = [...shoe];
    let dealtCards = [...dealtCardsSoFar];
    let hands: PlayerHand[][] = [];
    let dealerHand: PlayingCard[] = [];
    let firstCards: (PlayingCard | null)[] = [];

    // Deal the first card to each player
    for (let i = 0; i < MAX_BOXES; i++) {
      if (gameSettings.activePositions.includes(i + 1)) {
        const card = newShoe.pop()!;
        firstCards.push(card);
        dealtCards.push(card);
      } else {
        firstCards.push(null);
      }
    }

    // Dealer's first card
    const dealerFirstCard = newShoe.pop()!;
    dealerHand.push(dealerFirstCard);
    dealtCards.push(dealerFirstCard);

    // Second card to each player — assemble the box's final hand
    for (let i = 0; i < MAX_BOXES; i++) {
      const first = firstCards[i];
      if (first === null) {
        hands.push([]);
        continue;
      }
      const card = newShoe.pop()!;
      dealtCards.push(card);
      const cards = [first, card];
      const status: HandStatus = isNaturalBlackjack(cards) ? "blackjack" : "playing";
      hands.push([{ cards, status, doubled: false, isSplitAce: false }]);
    }

    // Dealer's hole card (kept hidden until every box is done)
    const dealerSecondCard = newShoe.pop()!;
    dealerHand.push(dealerSecondCard);
    dealtCards.push(dealerSecondCard);

    return { newShoe, dealtCards, hands, dealerHand };
  };

  // Find the next "playing" hand, first within the current box (resplit),
  // then in the following boxes
  const findNextPlayingHand = (
    hands: PlayerHand[][],
    fromBox: number,
    fromHand: number
  ): HandLocation | null => {
    for (let b = fromBox; b < hands.length; b++) {
      const startHand = b === fromBox ? fromHand : 0;
      for (let h = startHand; h < hands[b].length; h++) {
        if (hands[b][h].status === "playing") return { box: b, hand: h };
      }
    }
    return null;
  };

  // Deal the cards and figure out which hand to start with (or go
  // straight to the dealer)
  const prepareRound = (shoe: PlayingCard[], dealtCardsSoFar: PlayingCard[]) => {
    const deal = buildRoundDeal(shoe, dealtCardsSoFar);
    const firstLocation = findNextPlayingHand(deal.hands, 0, 0);
    return { ...deal, firstLocation };
  };

  // Dealer's turn: reveal the hole card and draw per the rules until done
  const runDealerTurn = (
    shoe: PlayingCard[],
    dealtCards: PlayingCard[],
    dealerHand: PlayingCard[]
  ) => {
    setGameState((prev) => ({
      ...prev,
      phase: "dealer-turn",
      activeBoxIndex: null,
      activeHandIndex: null,
      dealerHoleHidden: false,
    }));

    const step = (
      currentShoe: PlayingCard[],
      currentDealt: PlayingCard[],
      currentDealerHand: PlayingCard[]
    ) => {
      const { value, soft } = getHandInfo(currentDealerHand);
      const shouldHit =
        currentShoe.length > 0 &&
        (value < 17 || (value === 17 && soft && gameSettings.dealerHitsSoft17));

      if (!shouldHit) {
        setGameState((prev) => ({
          ...prev,
          shoe: currentShoe,
          dealtCards: currentDealt,
          dealerHand: currentDealerHand,
          phase: "counting",
        }));
        return;
      }

      setTimeout(() => {
        const newShoe = [...currentShoe];
        const card = newShoe.pop()!;
        const newDealt = [...currentDealt, card];
        const newDealerHand = [...currentDealerHand, card];
        setGameState((prev) => ({
          ...prev,
          shoe: newShoe,
          dealtCards: newDealt,
          dealerHand: newDealerHand,
        }));
        step(newShoe, newDealt, newDealerHand);
      }, 900);
    };

    step(shoe, dealtCards, dealerHand);
  };

  // Start the game — deals the first round immediately
  const initializeGame = () => {
    const shoe = createDeck();
    const cutPosition = Math.floor(shoe.length - gameSettings.cutCards * 52);
    const playableShoe = shoe.slice(0, cutPosition);

    const { newShoe, dealtCards, hands, dealerHand, firstLocation } = prepareRound(
      playableShoe,
      []
    );

    setGameState((prev) => ({
      ...prev,
      shoe: newShoe,
      dealtCards,
      currentRound: 1,
      playerCount: 0,
      actualCount: 0,
      gameStarted: true,
      phase: firstLocation !== null ? "player-turn" : "dealer-turn",
      activeBoxIndex: firstLocation?.box ?? null,
      activeHandIndex: firstLocation?.hand ?? null,
      playerInput: "",
      hands,
      dealerHand,
      dealerHoleHidden: true,
      score: { correct: 0, total: 0 },
    }));

    if (firstLocation === null) {
      runDealerTurn(newShoe, dealtCards, dealerHand);
    }
  };

  // Deal the next round
  const dealRound = () => {
    if (gameState.shoe.length < minCardsForRound()) {
      const accuracy =
        gameState.score.total > 0
          ? Math.round((gameState.score.correct / gameState.score.total) * 100)
          : 0;
      recordSession(gameState.currentRound, gameState.score);
      setGameState((prev) => ({
        ...prev,
        notice: `${t.deckEmptyPrefix} ${accuracy}%`,
      }));
      return;
    }

    const { newShoe, dealtCards, hands, dealerHand, firstLocation } = prepareRound(
      gameState.shoe,
      gameState.dealtCards
    );

    setGameState((prev) => ({
      ...prev,
      shoe: newShoe,
      dealtCards,
      hands,
      dealerHand,
      dealerHoleHidden: true,
      phase: firstLocation !== null ? "player-turn" : "dealer-turn",
      activeBoxIndex: firstLocation?.box ?? null,
      activeHandIndex: firstLocation?.hand ?? null,
      playerInput: "",
      currentRound: prev.currentRound + 1,
    }));

    if (firstLocation === null) {
      runDealerTurn(newShoe, dealtCards, dealerHand);
    }
  };

  // Hand the turn off to the next playing hand, or to the dealer
  const advanceTurn = (
    hands: PlayerHand[][],
    shoe: PlayingCard[],
    dealtCards: PlayingCard[],
    dealerHand: PlayingCard[],
    fromBox: number,
    fromHand: number
  ) => {
    const next = findNextPlayingHand(hands, fromBox, fromHand);
    if (next !== null) {
      setGameState((prev) => ({
        ...prev,
        activeBoxIndex: next.box,
        activeHandIndex: next.hand,
      }));
    } else {
      runDealerTurn(shoe, dealtCards, dealerHand);
    }
  };

  // Player hits the current hand
  const hit = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null || gameState.shoe.length === 0) return;
    const hand = gameState.hands[box][handIdx];
    if (hand.isSplitAce) return;

    const newShoe = [...gameState.shoe];
    const card = newShoe.pop()!;
    const newCards = [...hand.cards, card];
    const newDealtCards = [...gameState.dealtCards, card];
    const { value } = getHandInfo(newCards);
    const newStatus: HandStatus =
      value > 21 ? "bust" : value === 21 ? "stood" : "playing";

    const newHands = gameState.hands.map((boxHands) => [...boxHands]);
    newHands[box][handIdx] = { ...hand, cards: newCards, status: newStatus };

    setGameState((prev) => ({
      ...prev,
      shoe: newShoe,
      dealtCards: newDealtCards,
      hands: newHands,
    }));

    if (newStatus !== "playing") {
      advanceTurn(newHands, newShoe, newDealtCards, gameState.dealerHand, box, handIdx + 1);
    }
  };

  // Player stands on the current hand
  const stand = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null) return;

    const newHands = gameState.hands.map((boxHands) => [...boxHands]);
    newHands[box][handIdx] = { ...newHands[box][handIdx], status: "stood" };

    setGameState((prev) => ({ ...prev, hands: newHands }));
    advanceTurn(
      newHands,
      gameState.shoe,
      gameState.dealtCards,
      gameState.dealerHand,
      box,
      handIdx + 1
    );
  };

  // Player doubles down: one card and an automatic stand
  const double = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null) return;
    const hand = gameState.hands[box][handIdx];
    if (hand.cards.length !== 2 || hand.isSplitAce || gameState.shoe.length === 0)
      return;

    const newShoe = [...gameState.shoe];
    const card = newShoe.pop()!;
    const newCards = [...hand.cards, card];
    const newDealtCards = [...gameState.dealtCards, card];
    const { value } = getHandInfo(newCards);

    const newHands = gameState.hands.map((boxHands) => [...boxHands]);
    newHands[box][handIdx] = {
      cards: newCards,
      status: value > 21 ? "bust" : "stood",
      doubled: true,
      isSplitAce: false,
    };

    setGameState((prev) => ({
      ...prev,
      shoe: newShoe,
      dealtCards: newDealtCards,
      hands: newHands,
    }));

    advanceTurn(newHands, newShoe, newDealtCards, gameState.dealerHand, box, handIdx + 1);
  };

  // Player splits: the pair becomes two hands, each dealt one card. If a
  // new hand is a pair again, it can be split once more, up to
  // gameSettings.maxSplitHands hands in the box.
  // Exception — splitting Aces: each hand gets exactly one card and stands
  // immediately, with no further hits, doubling, or resplitting.
  const split = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null) return;

    const boxHands = gameState.hands[box];
    const hand = boxHands[handIdx];
    if (!canSplitHand(hand, boxHands.length) || gameState.shoe.length < 2) return;

    const isAceSplit = hand.cards[0].rank === "A";

    const newShoe = [...gameState.shoe];
    const cardA = newShoe.pop()!;
    const cardB = newShoe.pop()!;
    const newDealtCards = [...gameState.dealtCards, cardA, cardB];

    const makeSplitHand = (originalCard: PlayingCard, newCard: PlayingCard): PlayerHand => {
      const cards = [originalCard, newCard];
      // 21 right after a split isn't a natural blackjack, just a stand.
      // Ace-split hands always stand immediately regardless of total.
      const status: HandStatus =
        isAceSplit || getHandValue(cards) === 21 ? "stood" : "playing";
      return { cards, status, doubled: false, isSplitAce: isAceSplit };
    };

    const handA = makeSplitHand(hand.cards[0], cardA);
    const handB = makeSplitHand(hand.cards[1], cardB);

    const newBoxHands = [...boxHands];
    newBoxHands.splice(handIdx, 1, handA, handB);

    const newHands = gameState.hands.map((h, i) => (i === box ? newBoxHands : [...h]));

    setGameState((prev) => ({
      ...prev,
      shoe: newShoe,
      dealtCards: newDealtCards,
      hands: newHands,
    }));

    if (handA.status !== "playing") {
      advanceTurn(newHands, newShoe, newDealtCards, gameState.dealerHand, box, handIdx + 1);
    }
  };

  // Calculate the actual count
  const calculateActualCount = (cards: PlayingCard[]): number => {
    return cards.reduce((count, card) => count + getCountValue(card), 0);
  };

  // Check the player's answer
  const checkPlayerCount = () => {
    const playerCountNum = parseInt(gameState.playerInput);
    const actualCount = calculateActualCount(gameState.dealtCards);
    const isCorrect = playerCountNum === actualCount;
    // Compute these upfront and use the local constants below instead of
    // reading gameState from the closure — by the time the setTimeout
    // fires, gameState may already be stale.
    const canDealAnotherRound = gameState.shoe.length >= minCardsForRound();
    const roundsPlayed = gameState.currentRound;
    const finalScore = {
      correct: gameState.score.correct + (isCorrect ? 1 : 0),
      total: gameState.score.total + 1,
    };

    setGameState((prev) => ({
      ...prev,
      actualCount,
      playerCount: playerCountNum,
      score: finalScore,
      phase: "result",
    }));

    // Show the result for 2 seconds
    setTimeout(() => {
      if (!canDealAnotherRound) {
        const accuracy = Math.round(
          (finalScore.correct / finalScore.total) * 100
        );
        recordSession(roundsPlayed, finalScore);
        setGameState((prev) => ({
          ...prev,
          notice: `${t.deckEmptyPrefix} ${accuracy}%`,
        }));
      } else if (gameSettings.autoAdvance) {
        dealRound();
      }
    }, 2000);
  };

  const handStatusLabel: Record<HandStatus, string | null> = {
    playing: null,
    stood: t.statusStood,
    bust: t.statusBust,
    blackjack: t.statusBlackjack,
  };

  return (
    <div className="min-h-screen bg-green-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Blackjack Trainer</h1>
          <p className="text-green-200 mb-3">{t.appSubtitle}</p>
          {/* On mobile, once a game is running, the language switch moves into
              the slide-in menu below instead of sitting in the header. */}
          <div
            className={`justify-center gap-2 ${
              gameState.gameStarted ? "hidden sm:flex" : "flex"
            }`}
          >
            <button
              onClick={() => switchLanguage("ru")}
              className={langButtonClass(language === "ru")}
            >
              RU
            </button>
            <button
              onClick={() => switchLanguage("en")}
              className={langButtonClass(language === "en")}
            >
              EN
            </button>
          </div>
        </div>

        {/* Stats — only shown once a game is in progress. Kept to a single
            row (4 narrow tiles) even on mobile; the hamburger menu lives
            here too so it doesn't take extra space in the controls below. */}
        {gameState.gameStarted && (
          <div className="flex items-center gap-2 mb-6">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-4 flex-1">
              <div className="bg-green-700 rounded-lg p-1.5 sm:p-3 text-center">
                <div className="text-sm sm:text-xl font-bold">
                  {gameState.currentRound}
                </div>
                <div className="text-[10px] sm:text-xs">{t.statRound}</div>
              </div>
              <div className="bg-green-700 rounded-lg p-1.5 sm:p-3 text-center">
                <div className="text-sm sm:text-xl font-bold">
                  {gameState.score.total > 0
                    ? Math.round(
                        (gameState.score.correct / gameState.score.total) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div className="text-[10px] sm:text-xs">{t.statAccuracy}</div>
              </div>
              <div className="bg-green-700 rounded-lg p-1.5 sm:p-3 text-center">
                <div className="text-sm sm:text-xl font-bold">
                  {gameState.shoe.length}
                </div>
                <div className="text-[10px] sm:text-xs">
                  {t.statCardsLeft}
                </div>
              </div>
              <div className="bg-green-700 rounded-lg p-1.5 sm:p-3 text-center">
                <div className="text-sm sm:text-xl font-bold">
                  {gameSettings.countingSystem.toUpperCase()}
                </div>
                <div className="text-[10px] sm:text-xs">{t.statSystem}</div>
              </div>
            </div>
            <button
              onClick={() =>
                setGameState((prev) => ({ ...prev, showMenu: true }))
              }
              className="sm:hidden shrink-0 bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600"
              aria-label={t.btnSettings}
            >
              <MenuIcon size={18} />
            </button>
          </div>
        )}

        {/* Game board */}
        <div className="bg-green-700 rounded-lg p-6 mb-6">
          {!gameState.gameStarted ? (
            <div className="text-center">
              <h2 className="text-xl mb-4">{t.welcomeTitle}</h2>
              <p className="mb-4">{t.welcomeSubtitle}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, showSettings: true }))
                  }
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                >
                  <Settings size={20} />
                  <span>{t.btnSettings}</span>
                </button>
                <button
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, showHistory: true }))
                  }
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                >
                  <HistoryIcon size={20} />
                  <span>{t.btnHistory}</span>
                </button>
                <button
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, showHelp: true }))
                  }
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                >
                  <HelpCircle size={20} />
                  <span>{t.btnHelp}</span>
                </button>
                <button
                  onClick={initializeGame}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center space-x-2"
                >
                  <Play size={20} />
                  <span>{t.btnStart}</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Dealer */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">{t.dealerLabel}</h3>
                <div className="flex space-x-2">
                  {gameState.dealerHand.map((card, idx) => (
                    <Card
                      key={idx}
                      card={card}
                      hidden={idx === 1 && gameState.dealerHoleHidden}
                    />
                  ))}
                </div>
                {!gameState.dealerHoleHidden && gameState.dealerHand.length > 1 && (
                  <div className="text-sm mt-2">
                    {t.sumLabel}: {getHandValue(gameState.dealerHand)}
                  </div>
                )}
              </div>

              {/* Players */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {gameState.hands.map(
                  (boxHands, boxIdx) =>
                    gameSettings.activePositions.includes(boxIdx + 1) && (
                      <div key={boxIdx} className="bg-green-600 rounded-lg p-3">
                        <h4 className="font-bold mb-2">
                          {t.boxLabel} {boxIdx + 1}
                        </h4>
                        <div className="space-y-2">
                          {boxHands.map((hand, handIdx) => {
                            const isActive =
                              gameState.phase === "player-turn" &&
                              gameState.activeBoxIndex === boxIdx &&
                              gameState.activeHandIndex === handIdx;

                            return (
                              <div
                                key={handIdx}
                                className={`rounded-lg p-2 ${
                                  isActive ? "ring-4 ring-yellow-400" : ""
                                } ${boxHands.length > 1 ? "bg-green-700" : ""}`}
                              >
                                {boxHands.length > 1 && (
                                  <div className="text-xs font-semibold mb-1">
                                    {t.handLabel} {handIdx + 1}
                                  </div>
                                )}
                                <div className="flex space-x-1 mb-1">
                                  {hand.cards.map((card, cardIdx) => (
                                    <Card key={cardIdx} card={card} />
                                  ))}
                                </div>
                                <div className="text-sm mb-1">
                                  {t.sumLabel}: {getHandValue(hand.cards)}
                                  {hand.doubled && ` ${t.doubledTag}`}
                                </div>
                                {handStatusLabel[hand.status] && (
                                  <div className="text-sm font-bold mb-1">
                                    {handStatusLabel[hand.status]}
                                  </div>
                                )}
                                {isActive && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <button
                                      onClick={hit}
                                      disabled={gameState.shoe.length === 0}
                                      className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                                    >
                                      {t.btnHit}
                                    </button>
                                    <button
                                      onClick={stand}
                                      className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600"
                                    >
                                      {t.btnStand}
                                    </button>
                                    {hand.cards.length === 2 && (
                                      <button
                                        onClick={double}
                                        disabled={gameState.shoe.length === 0}
                                        className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
                                      >
                                        {t.btnDouble}
                                      </button>
                                    )}
                                    {canSplitHand(hand, boxHands.length) &&
                                      gameState.shoe.length >= 2 && (
                                        <button
                                          onClick={split}
                                          className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600"
                                        >
                                          {t.btnSplit}
                                        </button>
                                      )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                )}
              </div>

              {/* Count input */}
              {gameState.phase === "counting" && (
                <div className="bg-yellow-600 rounded-lg p-4 mb-4">
                  <h3 className="font-bold mb-2">{t.countPrompt}</h3>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <input
                      type="number"
                      value={gameState.playerInput}
                      onChange={(e) =>
                        setGameState((prev) => ({
                          ...prev,
                          playerInput: e.target.value,
                        }))
                      }
                      className="flex-1 min-w-0 px-3 py-2 rounded text-black"
                      placeholder={t.countPlaceholder}
                      autoFocus
                    />
                    <button
                      onClick={checkPlayerCount}
                      className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                      disabled={!gameState.playerInput}
                    >
                      {t.btnCheck}
                    </button>
                  </div>
                </div>
              )}

              {/* Last round's result */}
              {gameState.phase === "result" && (
                <div
                  className={`rounded-lg p-4 mb-4 ${
                    gameState.playerCount === gameState.actualCount
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  <div className="font-bold">
                    {gameState.playerCount === gameState.actualCount
                      ? t.resultCorrect
                      : t.resultIncorrect}
                  </div>
                  <div>
                    {t.yourAnswer}: {gameState.playerCount}
                  </div>
                  <div>
                    {t.correctCount}: {gameState.actualCount}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap justify-center items-center gap-4">
                {gameState.phase === "result" && (
                  <button
                    onClick={dealRound}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Play size={20} />
                    <span>{t.btnNextRound}</span>
                  </button>
                )}

                {/* Utility buttons (Settings/History/Help/New Game): inline
                    from the sm breakpoint up; on mobile they move into the
                    slide-in menu below to keep the in-game view uncluttered. */}
                <div className="hidden sm:flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() =>
                      setGameState((prev) => ({ ...prev, showSettings: true }))
                    }
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Settings size={20} />
                    <span>{t.btnSettings}</span>
                  </button>

                  <button
                    onClick={() =>
                      setGameState((prev) => ({ ...prev, showHistory: true }))
                    }
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <HistoryIcon size={20} />
                    <span>{t.btnHistory}</span>
                  </button>

                  <button
                    onClick={() =>
                      setGameState((prev) => ({ ...prev, showHelp: true }))
                    }
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <HelpCircle size={20} />
                    <span>{t.btnHelp}</span>
                  </button>

                  <button
                    onClick={() => {
                      recordSession(gameState.currentRound, gameState.score);
                      window.location.reload();
                    }}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 flex items-center space-x-2"
                  >
                    <RotateCcw size={20} />
                    <span>{t.btnNewGame}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reference info */}
        <div className="bg-green-700 rounded-lg p-4">
          <h3 className="font-bold mb-2">{t.referenceTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t.highLowName}</strong>
              <br />
              {t.highLowDesc}
            </div>
            <div>
              <strong>{t.omegaName}</strong>
              <br />
              {t.omegaDesc}
            </div>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {gameState.showSettings && (
        <SettingsPanel
          t={t}
          initialSettings={gameSettings}
          gameStarted={gameState.gameStarted}
          onApply={(settings) => {
            setGameSettings(settings);
            saveSettings(settings);
            setGameState((prev) => ({ ...prev, showSettings: false }));
          }}
          onCancel={() =>
            setGameState((prev) => ({ ...prev, showSettings: false }))
          }
        />
      )}

      {/* History modal */}
      {gameState.showHistory && (
        <HistoryPanel
          t={t}
          language={language}
          history={history}
          onClear={() => {
            setHistory([]);
            saveHistory([]);
          }}
          onClose={() =>
            setGameState((prev) => ({ ...prev, showHistory: false }))
          }
        />
      )}

      {/* Help modal */}
      {gameState.showHelp && (
        <HelpPanel
          t={t}
          onClose={() => setGameState((prev) => ({ ...prev, showHelp: false }))}
        />
      )}

      {/* Mobile-only slide-in menu for the utility buttons during a game */}
      {gameState.showMenu && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() =>
              setGameState((prev) => ({ ...prev, showMenu: false }))
            }
          />
          <div className="absolute right-0 top-0 h-full w-64 max-w-[80vw] bg-green-800 shadow-xl p-4 flex flex-col gap-3">
            <button
              onClick={() =>
                setGameState((prev) => ({ ...prev, showMenu: false }))
              }
              className="self-end text-white p-2 hover:bg-green-700 rounded"
              aria-label={t.close}
            >
              <CloseIcon size={22} />
            </button>

            <div className="flex justify-center gap-2 mb-2">
              <button
                onClick={() => switchLanguage("ru")}
                className={langButtonClass(language === "ru")}
              >
                RU
              </button>
              <button
                onClick={() => switchLanguage("en")}
                className={langButtonClass(language === "en")}
              >
                EN
              </button>
            </div>

            <button
              onClick={() =>
                setGameState((prev) => ({
                  ...prev,
                  showMenu: false,
                  showSettings: true,
                }))
              }
              className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
            >
              <Settings size={20} />
              <span>{t.btnSettings}</span>
            </button>

            <button
              onClick={() =>
                setGameState((prev) => ({
                  ...prev,
                  showMenu: false,
                  showHistory: true,
                }))
              }
              className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
            >
              <HistoryIcon size={20} />
              <span>{t.btnHistory}</span>
            </button>

            <button
              onClick={() =>
                setGameState((prev) => ({
                  ...prev,
                  showMenu: false,
                  showHelp: true,
                }))
              }
              className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
            >
              <HelpCircle size={20} />
              <span>{t.btnHelp}</span>
            </button>

            <button
              onClick={() => {
                recordSession(gameState.currentRound, gameState.score);
                window.location.reload();
              }}
              className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 flex items-center space-x-2"
            >
              <RotateCcw size={20} />
              <span>{t.btnNewGame}</span>
            </button>
          </div>
        </div>
      )}

      {/* Notices instead of alert() */}
      {gameState.notice && (
        <NoticeModal
          message={gameState.notice}
          okLabel={t.ok}
          onClose={() => setGameState((prev) => ({ ...prev, notice: null }))}
        />
      )}
    </div>
  );
};

export default BlackjackTrainer;
