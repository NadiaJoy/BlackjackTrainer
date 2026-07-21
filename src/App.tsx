import { useState, useEffect } from "react";
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
  STRINGS,
  loadLanguage,
  saveLanguage,
} from "./i18n";
import {
  applyDouble,
  applyHit,
  applySplit,
  calculateActualCount,
  canSplitHand,
  createDeck,
  findNextPlayingHand,
  getHandInfo,
  getHandValue,
  minCardsForRound,
  prepareRound,
  shouldDealerHit,
} from "./game";
import {
  appendHistory,
  loadHistory,
  loadSettings,
  saveHistory,
  saveSettings,
} from "./storage";
import type {
  GameSettings,
  GameState,
  HandStatus,
  PlayerHand,
  PlayingCard,
  SessionRecord,
} from "./types";
import Card from "./components/Card";
import NoticeModal from "./components/NoticeModal";
import SettingsPanel from "./components/SettingsPanel";
import HistoryPanel from "./components/HistoryPanel";
import HelpPanel from "./components/HelpPanel";

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
    const next = appendHistory(history, record);
    saveHistory(next);
    setHistory(next);
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
      const handInfo = getHandInfo(currentDealerHand);
      const shouldHit = shouldDealerHit(
        handInfo,
        currentShoe.length,
        gameSettings.dealerHitsSoft17
      );

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
    const shoe = createDeck(gameSettings.numDecks);
    const cutPosition = Math.floor(shoe.length - gameSettings.cutCards * 52);
    const playableShoe = shoe.slice(0, cutPosition);

    const { newShoe, dealtCards, hands, dealerHand, firstLocation } = prepareRound(
      playableShoe,
      [],
      gameSettings.activePositions
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
    if (gameState.shoe.length < minCardsForRound(gameSettings.activePositions)) {
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
      gameState.dealtCards,
      gameSettings.activePositions
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
    const newDealtCards = [...gameState.dealtCards, card];
    const updatedHand = applyHit(hand, card);

    const newHands = gameState.hands.map((boxHands) => [...boxHands]);
    newHands[box][handIdx] = updatedHand;

    setGameState((prev) => ({
      ...prev,
      shoe: newShoe,
      dealtCards: newDealtCards,
      hands: newHands,
    }));

    if (updatedHand.status !== "playing") {
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
    const newDealtCards = [...gameState.dealtCards, card];
    const updatedHand = applyDouble(hand, card);

    const newHands = gameState.hands.map((boxHands) => [...boxHands]);
    newHands[box][handIdx] = updatedHand;

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
  const split = () => {
    const box = gameState.activeBoxIndex;
    const handIdx = gameState.activeHandIndex;
    if (box === null || handIdx === null) return;

    const boxHands = gameState.hands[box];
    const hand = boxHands[handIdx];
    if (
      !canSplitHand(hand, boxHands.length, gameSettings.maxSplitHands) ||
      gameState.shoe.length < 2
    )
      return;

    const newShoe = [...gameState.shoe];
    const cardA = newShoe.pop()!;
    const cardB = newShoe.pop()!;
    const newDealtCards = [...gameState.dealtCards, cardA, cardB];

    const [handA, handB] = applySplit(hand, cardA, cardB);

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

  // Check the player's answer
  const checkPlayerCount = () => {
    const playerCountNum = parseInt(gameState.playerInput);
    const actualCount = calculateActualCount(
      gameState.dealtCards,
      gameSettings.countingSystem
    );
    const isCorrect = playerCountNum === actualCount;
    // Compute these upfront and use the local constants below instead of
    // reading gameState from the closure — by the time the setTimeout
    // fires, gameState may already be stale.
    const canDealAnotherRound =
      gameState.shoe.length >= minCardsForRound(gameSettings.activePositions);
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
                                    {canSplitHand(
                                      hand,
                                      boxHands.length,
                                      gameSettings.maxSplitHands
                                    ) &&
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
