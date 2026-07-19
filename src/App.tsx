import { useState, useCallback } from "react";
import { Settings, Play, RotateCcw } from "lucide-react";

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
  positions: number;
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
  hands: PlayerHand[][];
  dealerHand: PlayingCard[];
  dealerHoleHidden: boolean;
  notice: string | null;
}

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
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-gray-900 text-center">
      <p className="mb-6">{message}</p>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Ок
      </button>
    </div>
  </div>
);

interface SettingsPanelProps {
  initialSettings: GameSettings;
  gameStarted: boolean;
  onApply: (settings: GameSettings) => void;
  onCancel: () => void;
}

const SettingsPanel = ({
  initialSettings,
  gameStarted,
  onApply,
  onCancel,
}: SettingsPanelProps) => {
  const [draft, setDraft] = useState<GameSettings>(initialSettings);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-gray-900">
        <h3 className="text-xl font-bold mb-4">Настройки игры</h3>

        {gameStarted && (
          <p className="text-sm text-gray-500 mb-4">
            Число колод, глубина среза и система счёта фиксируются на время
            игры — доступны только для новой игры.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Количество колод:
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
              <option value={6}>6 колод</option>
              <option value={8}>8 колод</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Срезанные колоды:
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
              <option value={1.5}>1.5 колоды</option>
              <option value={2}>2 колоды</option>
              <option value={3}>3 колоды</option>
              <option value={4}>4 колоды</option>
              <option value={5}>5 колод</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Система счета:
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
              <option value="high-low">High-Low (+1, 0, -1)</option>
              <option value="omega-2">Omega II (+2, +1, 0, -1, -2)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Позиции игроков:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((pos) => (
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
                  <span>Бокс {pos}</span>
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
              <span className="text-sm font-medium">
                Автоматически переходить к следующему раунду
              </span>
            </label>
            {!draft.autoAdvance && (
              <p className="text-sm text-gray-500 mt-1">
                После проверки счёта нужно будет нажимать «Следующий раунд»
                самостоятельно.
              </p>
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
              <span className="text-sm font-medium">
                Дилер добирает карту на мягком 17 (H17)
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {draft.dealerHitsSoft17
                ? "Дилер берёт ещё карту при мягком 17 (например, туз + 6)."
                : "Дилер останавливается на 17, включая мягкое (по умолчанию)."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Максимум рук после сплита:
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
              <option value={2}>2 руки (пересплит запрещён)</option>
              <option value={3}>3 руки</option>
              <option value={4}>4 руки (по умолчанию)</option>
              <option value={99}>Без ограничений</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Пара внутри бокса даёт «Сплит»: рука делится на две, каждая
              получает свою карту. Если в одной из новых рук снова пара — её
              тоже можно сплитовать, пока не будет достигнут лимит.
            </p>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(draft)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

const BlackjackTrainer = () => {
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    numDecks: 6,
    cutCards: 1.5,
    countingSystem: "high-low",
    positions: 3,
    activePositions: [1, 2, 3],
    autoAdvance: true,
    dealerHitsSoft17: false,
    maxSplitHands: 4,
  });

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
    hands: [],
    dealerHand: [],
    dealerHoleHidden: true,
    notice: null,
  });

  // Создание колоды
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

  // Системы счета карт
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

  // Значение руки + признак "мягкой" руки (туз всё ещё считается за 11)
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

  const canSplitHand = (hand: PlayerHand, handsInBox: number): boolean =>
    hand.cards.length === 2 &&
    hand.cards[0].rank === hand.cards[1].rank &&
    handsInBox < gameSettings.maxSplitHands;

  // Минимум карт, нужный для раздачи ещё одного раунда
  const minCardsForRound = () => (gameSettings.activePositions.length + 1) * 2;

  // Раздача стартовых карт одного раунда (чистая функция, без обращения к state)
  const buildRoundDeal = (shoe: PlayingCard[], dealtCardsSoFar: PlayingCard[]) => {
    let newShoe = [...shoe];
    let dealtCards = [...dealtCardsSoFar];
    let hands: PlayerHand[][] = [];
    let dealerHand: PlayingCard[] = [];
    let firstCards: (PlayingCard | null)[] = [];

    // Раздача первой карты каждому игроку
    for (let i = 0; i < gameSettings.positions; i++) {
      if (gameSettings.activePositions.includes(i + 1)) {
        const card = newShoe.pop()!;
        firstCards.push(card);
        dealtCards.push(card);
      } else {
        firstCards.push(null);
      }
    }

    // Первая карта дилера
    const dealerFirstCard = newShoe.pop()!;
    dealerHand.push(dealerFirstCard);
    dealtCards.push(dealerFirstCard);

    // Вторая карта каждому игроку — собираем итоговую руку бокса
    for (let i = 0; i < gameSettings.positions; i++) {
      const first = firstCards[i];
      if (first === null) {
        hands.push([]);
        continue;
      }
      const card = newShoe.pop()!;
      dealtCards.push(card);
      const cards = [first, card];
      const status: HandStatus = isNaturalBlackjack(cards) ? "blackjack" : "playing";
      hands.push([{ cards, status, doubled: false }]);
    }

    // Закрытая карта дилера (не показываем, пока не сыграют все боксы)
    const dealerSecondCard = newShoe.pop()!;
    dealerHand.push(dealerSecondCard);
    dealtCards.push(dealerSecondCard);

    return { newShoe, dealtCards, hands, dealerHand };
  };

  // Найти следующую руку в статусе "playing", сначала в пределах текущего
  // бокса (пересплит), затем в следующих боксах
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

  // Раздать карты и определить, с какой руки начинать (или сразу к дилеру)
  const prepareRound = (shoe: PlayingCard[], dealtCardsSoFar: PlayingCard[]) => {
    const deal = buildRoundDeal(shoe, dealtCardsSoFar);
    const firstLocation = findNextPlayingHand(deal.hands, 0, 0);
    return { ...deal, firstLocation };
  };

  // Ход дилера: открыть закрытую карту и добирать по правилам до конца
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

  // Инициализация игры — сразу сдаёт первый раунд
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

  // Раздача следующего раунда
  const dealRound = () => {
    if (gameState.shoe.length < minCardsForRound()) {
      const accuracy =
        gameState.score.total > 0
          ? Math.round((gameState.score.correct / gameState.score.total) * 100)
          : 0;
      setGameState((prev) => ({
        ...prev,
        notice: `Колода закончилась! Точность за игру: ${accuracy}%`,
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

  // Передать ход следующей играющей руке либо дилеру
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

  // Игрок берёт карту в текущую руку
  const hit = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null || gameState.shoe.length === 0) return;

    const newShoe = [...gameState.shoe];
    const card = newShoe.pop()!;
    const hand = gameState.hands[box][handIdx];
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

  // Игрок останавливается с текущей рукой
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

  // Игрок удваивает ставку: одна карта и автоматический стоп
  const double = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null) return;
    const hand = gameState.hands[box][handIdx];
    if (hand.cards.length !== 2 || gameState.shoe.length === 0) return;

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
    };

    setGameState((prev) => ({
      ...prev,
      shoe: newShoe,
      dealtCards: newDealtCards,
      hands: newHands,
    }));

    advanceTurn(newHands, newShoe, newDealtCards, gameState.dealerHand, box, handIdx + 1);
  };

  // Игрок делает сплит: пара делится на две руки, каждая получает по карте.
  // Если после сплита в одной из новых рук снова пара — её можно сплитовать
  // ещё раз, вплоть до gameSettings.maxSplitHands рук в боксе.
  const split = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null) return;

    const boxHands = gameState.hands[box];
    const hand = boxHands[handIdx];
    if (!canSplitHand(hand, boxHands.length) || gameState.shoe.length < 2) return;

    const newShoe = [...gameState.shoe];
    const cardA = newShoe.pop()!;
    const cardB = newShoe.pop()!;
    const newDealtCards = [...gameState.dealtCards, cardA, cardB];

    const makeSplitHand = (originalCard: PlayingCard, newCard: PlayingCard): PlayerHand => {
      const cards = [originalCard, newCard];
      // 21 после сплита — не натуральный блэкджек, просто стоп
      const status: HandStatus = getHandValue(cards) === 21 ? "stood" : "playing";
      return { cards, status, doubled: false };
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

  // Подсчет актуального счета
  const calculateActualCount = (cards: PlayingCard[]): number => {
    return cards.reduce((count, card) => count + getCountValue(card), 0);
  };

  // Проверка ответа игрока
  const checkPlayerCount = () => {
    const playerCountNum = parseInt(gameState.playerInput);
    const actualCount = calculateActualCount(gameState.dealtCards);
    const isCorrect = playerCountNum === actualCount;
    // Считаем заранее и используем локальные константы ниже, а не gameState
    // из замыкания — к моменту срабатывания setTimeout значения в gameState
    // уже могли устареть.
    const canDealAnotherRound = gameState.shoe.length >= minCardsForRound();
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

    // Показать результат на 2 секунды
    setTimeout(() => {
      if (!canDealAnotherRound) {
        const accuracy = Math.round(
          (finalScore.correct / finalScore.total) * 100
        );
        setGameState((prev) => ({
          ...prev,
          notice: `Колода закончилась! Точность за игру: ${accuracy}%`,
        }));
      } else if (gameSettings.autoAdvance) {
        dealRound();
      }
    }, 2000);
  };

  const handStatusLabel: Record<HandStatus, string | null> = {
    playing: null,
    stood: "Стоп",
    bust: "Перебор",
    blackjack: "Блэкджек!",
  };

  return (
    <div className="min-h-screen bg-green-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Blackjack Trainer</h1>
          <p className="text-green-200">Тренировка счета карт</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{gameState.currentRound}</div>
            <div className="text-xs">Раунд</div>
          </div>
          <div className="bg-green-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">
              {gameState.score.total > 0
                ? Math.round(
                    (gameState.score.correct / gameState.score.total) * 100
                  )
                : 0}
              %
            </div>
            <div className="text-xs">Точность</div>
          </div>
          <div className="bg-green-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{gameState.shoe.length}</div>
            <div className="text-xs">Карт осталось</div>
          </div>
          <div className="bg-green-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">
              {gameSettings.countingSystem.toUpperCase()}
            </div>
            <div className="text-xs">Система</div>
          </div>
        </div>

        {/* Игровое поле */}
        <div className="bg-green-700 rounded-lg p-6 mb-6">
          {!gameState.gameStarted ? (
            <div className="text-center">
              <h2 className="text-xl mb-4">
                Добро пожаловать в тренер блэкджека!
              </h2>
              <p className="mb-4">
                Настройте параметры игры и начните тренировку счета карт
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, showSettings: true }))
                  }
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                >
                  <Settings size={20} />
                  <span>Настройки</span>
                </button>
                <button
                  onClick={initializeGame}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center space-x-2"
                >
                  <Play size={20} />
                  <span>Начать игру</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Дилер */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">Дилер</h3>
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
                    Сумма: {getHandValue(gameState.dealerHand)}
                  </div>
                )}
              </div>

              {/* Игроки */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {gameState.hands.map(
                  (boxHands, boxIdx) =>
                    gameSettings.activePositions.includes(boxIdx + 1) && (
                      <div key={boxIdx} className="bg-green-600 rounded-lg p-3">
                        <h4 className="font-bold mb-2">Бокс {boxIdx + 1}</h4>
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
                                    Рука {handIdx + 1}
                                  </div>
                                )}
                                <div className="flex space-x-1 mb-1">
                                  {hand.cards.map((card, cardIdx) => (
                                    <Card key={cardIdx} card={card} />
                                  ))}
                                </div>
                                <div className="text-sm mb-1">
                                  Сумма: {getHandValue(hand.cards)}
                                  {hand.doubled && " (х2)"}
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
                                      Взять
                                    </button>
                                    <button
                                      onClick={stand}
                                      className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600"
                                    >
                                      Стоп
                                    </button>
                                    {hand.cards.length === 2 && (
                                      <button
                                        onClick={double}
                                        disabled={gameState.shoe.length === 0}
                                        className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
                                      >
                                        Х2
                                      </button>
                                    )}
                                    {canSplitHand(hand, boxHands.length) &&
                                      gameState.shoe.length >= 2 && (
                                        <button
                                          onClick={split}
                                          className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600"
                                        >
                                          Сплит
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

              {/* Ввод счета */}
              {gameState.phase === "counting" && (
                <div className="bg-yellow-600 rounded-lg p-4 mb-4">
                  <h3 className="font-bold mb-2">Введите текущий счет:</h3>
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
                      placeholder="Ваш счет"
                      autoFocus
                    />
                    <button
                      onClick={checkPlayerCount}
                      className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                      disabled={!gameState.playerInput}
                    >
                      Проверить
                    </button>
                  </div>
                </div>
              )}

              {/* Результат последнего раунда */}
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
                      ? "✓ Правильно!"
                      : "✗ Неправильно"}
                  </div>
                  <div>Ваш ответ: {gameState.playerCount}</div>
                  <div>Правильный счет: {gameState.actualCount}</div>
                </div>
              )}

              {/* Кнопки управления */}
              <div className="flex flex-wrap justify-center gap-4">
                {gameState.phase === "result" && (
                  <button
                    onClick={dealRound}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Play size={20} />
                    <span>Следующий раунд</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, showSettings: true }))
                  }
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Settings size={20} />
                  <span>Настройки</span>
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 flex items-center space-x-2"
                >
                  <RotateCcw size={20} />
                  <span>Новая игра</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Справочная информация */}
        <div className="bg-green-700 rounded-lg p-4">
          <h3 className="font-bold mb-2">Системы счета карт:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>High-Low:</strong>
              <br />
              2-6: +1, 7-9: 0, 10-A: -1
            </div>
            <div>
              <strong>Omega II:</strong>
              <br />
              2,3,7: +1, 4,5,6: +2, 8,A: 0, 9: -1, 10,J,Q,K: -2
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно настроек */}
      {gameState.showSettings && (
        <SettingsPanel
          initialSettings={gameSettings}
          gameStarted={gameState.gameStarted}
          onApply={(settings) => {
            setGameSettings(settings);
            setGameState((prev) => ({ ...prev, showSettings: false }));
          }}
          onCancel={() =>
            setGameState((prev) => ({ ...prev, showSettings: false }))
          }
        />
      )}

      {/* Уведомления вместо alert() */}
      {gameState.notice && (
        <NoticeModal
          message={gameState.notice}
          onClose={() => setGameState((prev) => ({ ...prev, notice: null }))}
        />
      )}
    </div>
  );
};

export default BlackjackTrainer;
