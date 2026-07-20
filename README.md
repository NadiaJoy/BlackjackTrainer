# Blackjack Trainer

### What this is

**Blackjack Trainer** is a training tool for practicing **card counting** in blackjack (21). It lets you practice at home instead of at a real casino table with real money on the line.

The app's interface is fully bilingual: the **RU / EN** switcher in the header changes the entire UI, including a built-in "Help" screen with instructions written for the player, not the developer.

If you're not familiar with blackjack, here's the short version:

- Blackjack is a card game where you try to get a hand total as close to 21 as possible without going over.
- **Card counting** is a legal technique where a player mentally tracks which cards have already been dealt. Each card is assigned a small value (for example +1, 0, or −1), and the player keeps a running sum — the "count." A higher count means more high-value cards (aces and tens) remain in the deck, which gives the player a statistical edge.
- This technique only works where cards are dealt from a physical shoe down to a cut card — not where a continuous shuffling machine (CSM) is used. A CSM reshuffles the deck after every hand, which "resets" the count and makes counting useless.

This trainer specifically simulates a table **without a CSM**: the shoe is shuffled once and played all the way down to the cut card, just like a real table.

### How the trainer works

1. You configure the game: number of decks (6 or 8), penetration, counting system, active player boxes (seats at the table), whether rounds auto-advance, the dealer's soft-17 rule (H17/S17), and the max hands allowed after a split.
2. Click "Start Game" — the shoe is shuffled and the first round is dealt immediately, just like a real dealer would.
3. Each active box, in turn, gets real decisions: **Hit / Stand / Double / Split** — just like a real table.
   - Split is available on equal card *value*, not just identical rank — e.g. a queen and a king can be split together, since both are worth 10.
   - If a freshly split hand pairs up again, it can be split again, up to the configured limit.
   - Splitting Aces is the one exception: each new hand gets exactly one card and stands immediately — no further hits, doubling, or resplitting, even if that one card is another Ace.
4. Once every box is resolved, the dealer reveals the hidden card and draws according to the chosen rule.
5. Then you enter the current count under the chosen system — the sum of every card's value since the shoe started.
6. The app checks your answer and tracks your accuracy (% correct). When the shoe runs out, the result is saved to **"History"**, which shows your all-time average accuracy and a list of past sessions.

### Counting systems

- **High-Low** — the simplest and most widely used system: cards 2–6 are worth +1, cards 7–9 are worth 0, and cards 10 through ace are worth −1.
- **Omega II** — a more advanced system with finer-grained values (+2, +1, 0, −1, −2). It's more accurate but takes more practice to use fluently.

### Running the project

**Requirements:** [Node.js](https://nodejs.org/) version 18 or newer (npm is included).

```bash
# 1. Install dependencies (once)
npm install

# 2. Run in development mode
npm run dev
```

The terminal will print a local address (usually `http://localhost:5173`) — open it in your browser.

Other useful commands:

```bash
# Build a production bundle (output goes to dist/)
npm run build

# Preview the production build locally
npm run preview
```

### Opening it on your phone

The app can be installed to your home screen as a PWA (Progressive Web App):

- **iOS (Safari):** open the site → tap "Share" → "Add to Home Screen."
- **Android (Chrome):** open the site → menu (three dots) → "Install app."

Settings, interface language, and session history are saved in the device's browser (`localStorage`) — everything picks up where you left off next time you open it.
