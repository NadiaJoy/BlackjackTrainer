import type {
  CountingSystem,
  GameSettings,
  HandLocation,
  HandStatus,
  PlayerHand,
  PlayingCard,
  Rank,
  Suit,
} from "./types";

// The number of boxes at the table is fixed in the UI (checkboxes "Box
// 1".."Box 6"), so we use it directly as the hands array size instead of
// a separate configurable field that used to be out of sync with the
// checkboxes.
export const MAX_BOXES = 6;

export const DEFAULT_SETTINGS: GameSettings = {
  numDecks: 6,
  cutCards: 1.5,
  countingSystem: "high-low",
  activePositions: [1, 2, 3],
  autoAdvance: true,
  dealerHitsSoft17: false,
  maxSplitHands: 4,
};

export const getCardValue = (rank: Rank): number => {
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank);
};

export const shuffleDeck = (deck: PlayingCard[]): PlayingCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createDeck = (numDecks: number): PlayingCard[] => {
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

  for (let d = 0; d < numDecks; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit, value: getCardValue(rank) });
      }
    }
  }
  return shuffleDeck(deck);
};

// Counting systems
export const getCountValue = (
  card: PlayingCard,
  countingSystem: CountingSystem
): number => {
  const { rank } = card;

  if (countingSystem === "high-low") {
    if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
    if (["10", "J", "Q", "K", "A"].includes(rank)) return -1;
    return 0;
  }

  if (countingSystem === "omega-2") {
    if (["2", "3", "7"].includes(rank)) return 1;
    if (["4", "5", "6"].includes(rank)) return 2;
    if (["9"].includes(rank)) return -1;
    if (["10", "J", "Q", "K"].includes(rank)) return -2;
    return 0;
  }

  return 0;
};

export const calculateActualCount = (
  cards: PlayingCard[],
  countingSystem: CountingSystem
): number =>
  cards.reduce((count, card) => count + getCountValue(card, countingSystem), 0);

// Hand value + whether it's "soft" (an Ace is still counted as 11)
export const getHandInfo = (
  hand: PlayingCard[]
): { value: number; soft: boolean } => {
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

export const getHandValue = (hand: PlayingCard[]): number =>
  getHandInfo(hand).value;

export const isNaturalBlackjack = (hand: PlayingCard[]): boolean =>
  hand.length === 2 && getHandValue(hand) === 21;

// Splitting is allowed on equal card VALUE, not rank — e.g. a queen and
// a king also count as a pair (both worth 10). Ace-split hands can never
// be split again, even if the drawn card is another Ace.
export const canSplitHand = (
  hand: PlayerHand,
  handsInBox: number,
  maxSplitHands: number
): boolean =>
  !hand.isSplitAce &&
  hand.cards.length === 2 &&
  hand.cards[0].value === hand.cards[1].value &&
  handsInBox < maxSplitHands;

// Minimum cards needed to deal another round
export const minCardsForRound = (activePositions: number[]): number =>
  (activePositions.length + 1) * 2;

// Deal the starting cards for one round (pure function, no state access)
export const buildRoundDeal = (
  shoe: PlayingCard[],
  dealtCardsSoFar: PlayingCard[],
  activePositions: number[]
) => {
  const newShoe = [...shoe];
  const dealtCards = [...dealtCardsSoFar];
  const hands: PlayerHand[][] = [];
  const dealerHand: PlayingCard[] = [];
  const firstCards: (PlayingCard | null)[] = [];

  // Deal the first card to each player
  for (let i = 0; i < MAX_BOXES; i++) {
    if (activePositions.includes(i + 1)) {
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
    const status: HandStatus = isNaturalBlackjack(cards)
      ? "blackjack"
      : "playing";
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
export const findNextPlayingHand = (
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
export const prepareRound = (
  shoe: PlayingCard[],
  dealtCardsSoFar: PlayingCard[],
  activePositions: number[]
) => {
  const deal = buildRoundDeal(shoe, dealtCardsSoFar, activePositions);
  const firstLocation = findNextPlayingHand(deal.hands, 0, 0);
  return { ...deal, firstLocation };
};

// Whether the dealer must draw another card, per the H17/S17 rule
export const shouldDealerHit = (
  handInfo: { value: number; soft: boolean },
  shoeLength: number,
  dealerHitsSoft17: boolean
): boolean =>
  shoeLength > 0 &&
  (handInfo.value < 17 ||
    (handInfo.value === 17 && handInfo.soft && dealerHitsSoft17));

// Player hits: draw one card, recompute status
export const applyHit = (hand: PlayerHand, card: PlayingCard): PlayerHand => {
  const newCards = [...hand.cards, card];
  const { value } = getHandInfo(newCards);
  const status: HandStatus =
    value > 21 ? "bust" : value === 21 ? "stood" : "playing";
  return { ...hand, cards: newCards, status };
};

// Player doubles down: one card and an automatic stand
export const applyDouble = (
  hand: PlayerHand,
  card: PlayingCard
): PlayerHand => {
  const newCards = [...hand.cards, card];
  const { value } = getHandInfo(newCards);
  return {
    cards: newCards,
    status: value > 21 ? "bust" : "stood",
    doubled: true,
    isSplitAce: false,
  };
};

// Player splits: the pair becomes two hands, each dealt one card.
// Exception — splitting Aces: each hand gets exactly one card and stands
// immediately, with no further hits, doubling, or resplitting.
export const applySplit = (
  hand: PlayerHand,
  cardA: PlayingCard,
  cardB: PlayingCard
): [PlayerHand, PlayerHand] => {
  const isAceSplit = hand.cards[0].rank === "A";

  const makeSplitHand = (
    originalCard: PlayingCard,
    newCard: PlayingCard
  ): PlayerHand => {
    const cards = [originalCard, newCard];
    // 21 right after a split isn't a natural blackjack, just a stand.
    // Ace-split hands always stand immediately regardless of total.
    const status: HandStatus =
      isAceSplit || getHandValue(cards) === 21 ? "stood" : "playing";
    return { cards, status, doubled: false, isSplitAce: isAceSplit };
  };

  return [
    makeSplitHand(hand.cards[0], cardA),
    makeSplitHand(hand.cards[1], cardB),
  ];
};
