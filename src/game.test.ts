import { describe, expect, it } from "vitest";
import {
  applyDouble,
  applyHit,
  applySplit,
  buildRoundDeal,
  calculateActualCount,
  canSplitHand,
  createDeck,
  findNextPlayingHand,
  getCardValue,
  getHandInfo,
  getHandValue,
  isNaturalBlackjack,
  minCardsForRound,
  prepareRound,
  shouldDealerHit,
} from "./game";
import type { PlayerHand, PlayingCard } from "./types";

const card = (rank: PlayingCard["rank"], suit: PlayingCard["suit"] = "♠"): PlayingCard => ({
  rank,
  suit,
  value: getCardValue(rank),
});

const hand = (
  cards: PlayingCard[],
  overrides: Partial<PlayerHand> = {}
): PlayerHand => ({
  cards,
  status: "playing",
  doubled: false,
  isSplitAce: false,
  ...overrides,
});

describe("getCardValue", () => {
  it("values an ace at 11", () => {
    expect(getCardValue("A")).toBe(11);
  });

  it("values face cards at 10", () => {
    expect(getCardValue("J")).toBe(10);
    expect(getCardValue("Q")).toBe(10);
    expect(getCardValue("K")).toBe(10);
  });

  it("values number cards at face value", () => {
    expect(getCardValue("7")).toBe(7);
  });
});

describe("createDeck", () => {
  it("builds numDecks * 52 cards", () => {
    expect(createDeck(6)).toHaveLength(6 * 52);
    expect(createDeck(1)).toHaveLength(52);
  });
});

describe("getHandInfo / getHandValue", () => {
  it("sums a hard hand", () => {
    expect(getHandValue([card("9"), card("7")])).toBe(16);
  });

  it("counts a single ace as soft 11 when it fits", () => {
    const info = getHandInfo([card("A"), card("6")]);
    expect(info).toEqual({ value: 17, soft: true });
  });

  it("drops an ace to 1 once the hand would otherwise bust", () => {
    const info = getHandInfo([card("A"), card("6"), card("9")]);
    expect(info).toEqual({ value: 16, soft: false });
  });

  it("handles two aces (soft 12, or 21 with a 9)", () => {
    expect(getHandInfo([card("A"), card("A")])).toEqual({
      value: 12,
      soft: true,
    });
    expect(getHandInfo([card("A"), card("A"), card("9")])).toEqual({
      value: 21,
      soft: true,
    });
  });

  it("busts over 21 with no soft aces left", () => {
    const info = getHandInfo([card("K"), card("Q"), card("5")]);
    expect(info).toEqual({ value: 25, soft: false });
  });
});

describe("isNaturalBlackjack", () => {
  it("is true only for a 2-card 21", () => {
    expect(isNaturalBlackjack([card("A"), card("K")])).toBe(true);
    expect(isNaturalBlackjack([card("7"), card("7"), card("7")])).toBe(false);
    expect(isNaturalBlackjack([card("A"), card("9")])).toBe(false);
  });
});

describe("canSplitHand", () => {
  it("allows splitting equal ranks", () => {
    const h = hand([card("8"), card("8")]);
    expect(canSplitHand(h, 1, 4)).toBe(true);
  });

  it("allows splitting equal-value mixed tens (queen + king)", () => {
    const h = hand([card("Q"), card("K")]);
    expect(canSplitHand(h, 1, 4)).toBe(true);
  });

  it("rejects unequal cards", () => {
    const h = hand([card("8"), card("9")]);
    expect(canSplitHand(h, 1, 4)).toBe(false);
  });

  it("rejects once the box is at its resplit limit", () => {
    const h = hand([card("8"), card("8")]);
    expect(canSplitHand(h, 4, 4)).toBe(false);
  });

  it("never allows resplitting a split-Ace hand", () => {
    const h = hand([card("A"), card("A")], { isSplitAce: true });
    expect(canSplitHand(h, 1, 4)).toBe(false);
  });
});

describe("minCardsForRound", () => {
  it("needs 2 cards per active box plus the dealer", () => {
    expect(minCardsForRound([1, 2, 3])).toBe(8);
    expect(minCardsForRound([1])).toBe(4);
  });
});

describe("buildRoundDeal", () => {
  it("deals 2 cards to each active box and 2 to the dealer", () => {
    const shoe = createDeck(6);
    const { newShoe, dealtCards, hands, dealerHand } = buildRoundDeal(
      shoe,
      [],
      [1, 2, 3]
    );

    expect(dealerHand).toHaveLength(2);
    expect(hands).toHaveLength(6); // MAX_BOXES
    [0, 1, 2].forEach((i) => expect(hands[i][0].cards).toHaveLength(2));
    [3, 4, 5].forEach((i) => expect(hands[i]).toHaveLength(0));
    expect(dealtCards).toHaveLength(3 * 2 + 2);
    expect(newShoe).toHaveLength(shoe.length - dealtCards.length);
  });

  it("flags a natural blackjack on the opening two cards", () => {
    // Rig a tiny shoe: pop() takes from the end, and with one active box
    // the deal order is [box1 first, dealer up, box1 second, dealer hole].
    // List the shoe in reverse of that so the right cards get popped.
    const shoe: PlayingCard[] = [
      card("3"), // dealer hole, popped 4th
      card("K"), // box 1's second card, popped 3rd
      card("2"), // dealer's up card, popped 2nd
      card("A"), // box 1's first card, popped 1st
    ];
    const { hands } = buildRoundDeal(shoe, [], [1]);
    expect(hands[0][0].cards.map((c) => c.rank)).toEqual(["A", "K"]);
    expect(hands[0][0].status).toBe("blackjack");
  });
});

describe("findNextPlayingHand", () => {
  it("finds the next playing hand within the same box first", () => {
    const hands: PlayerHand[][] = [
      [hand([], { status: "stood" }), hand([], { status: "playing" })],
      [hand([], { status: "playing" })],
    ];
    expect(findNextPlayingHand(hands, 0, 1)).toEqual({ box: 0, hand: 1 });
  });

  it("moves to the next box once the current one is done", () => {
    const hands: PlayerHand[][] = [
      [hand([], { status: "stood" })],
      [hand([], { status: "playing" })],
    ];
    expect(findNextPlayingHand(hands, 0, 0)).toEqual({ box: 1, hand: 0 });
  });

  it("returns null once every hand is resolved", () => {
    const hands: PlayerHand[][] = [[hand([], { status: "bust" })]];
    expect(findNextPlayingHand(hands, 0, 0)).toBeNull();
  });
});

describe("prepareRound", () => {
  it("points at the first playing hand", () => {
    const { firstLocation } = prepareRound(createDeck(6), [], [1, 2]);
    expect(firstLocation).toEqual({ box: 0, hand: 0 });
  });

  it("goes straight to the dealer if no boxes are active", () => {
    const { firstLocation } = prepareRound(createDeck(6), [], []);
    expect(firstLocation).toBeNull();
  });
});

describe("calculateActualCount", () => {
  it("sums High-Low values", () => {
    const cards = [card("2"), card("6"), card("10"), card("A")];
    // 2,6 -> +1 each, 10,A -> -1 each => 0
    expect(calculateActualCount(cards, "high-low")).toBe(0);
  });

  it("sums Omega II values", () => {
    const cards = [card("4"), card("9"), card("K")];
    // 4 -> +2, 9 -> -1, K -> -2 => -1
    expect(calculateActualCount(cards, "omega-2")).toBe(-1);
  });
});

describe("shouldDealerHit", () => {
  it("always hits below 17", () => {
    expect(shouldDealerHit({ value: 16, soft: false }, 10, false)).toBe(true);
  });

  it("stands on hard 17+", () => {
    expect(shouldDealerHit({ value: 17, soft: false }, 10, true)).toBe(false);
  });

  it("stands on soft 17 under the S17 rule", () => {
    expect(shouldDealerHit({ value: 17, soft: true }, 10, false)).toBe(false);
  });

  it("hits soft 17 under the H17 rule", () => {
    expect(shouldDealerHit({ value: 17, soft: true }, 10, true)).toBe(true);
  });

  it("never hits with an empty shoe", () => {
    expect(shouldDealerHit({ value: 10, soft: false }, 0, false)).toBe(false);
  });
});

describe("applyHit", () => {
  it("stays in play under 21", () => {
    const result = applyHit(hand([card("5"), card("4")]), card("2"));
    expect(result.status).toBe("playing");
  });

  it("stands automatically on exactly 21", () => {
    const result = applyHit(hand([card("5"), card("6")]), card("K"));
    expect(result.status).toBe("stood");
  });

  it("busts over 21", () => {
    const result = applyHit(hand([card("K"), card("9")]), card("5"));
    expect(result.status).toBe("bust");
  });
});

describe("applyDouble", () => {
  it("stands with the doubled flag set", () => {
    const result = applyDouble(hand([card("5"), card("6")]), card("2"));
    expect(result.status).toBe("stood");
    expect(result.doubled).toBe(true);
    expect(result.cards).toHaveLength(3);
  });

  it("can still bust", () => {
    const result = applyDouble(hand([card("K"), card("9")]), card("5"));
    expect(result.status).toBe("bust");
  });
});

describe("applySplit", () => {
  it("splits a normal pair into two playing hands", () => {
    const [a, b] = applySplit(hand([card("8"), card("8")]), card("3"), card("4"));
    expect(a.status).toBe("playing");
    expect(b.status).toBe("playing");
    expect(a.isSplitAce).toBe(false);
  });

  it("splitting Aces stands both hands immediately, even at 12", () => {
    const [a, b] = applySplit(hand([card("A"), card("A")]), card("3"), card("7"));
    expect(a.isSplitAce).toBe(true);
    expect(b.isSplitAce).toBe(true);
    expect(a.status).toBe("stood");
    expect(b.status).toBe("stood");
  });

  it("a post-split 21 stands but is not a blackjack status", () => {
    const [a] = applySplit(hand([card("10"), card("10")]), card("A"), card("2"));
    expect(a.status).toBe("stood");
  });
});
