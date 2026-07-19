# Blackjack Trainer

🇷🇺 [Русский](#русский) · 🇬🇧 [English](#english)

---

## Русский

### Что это такое

**Blackjack Trainer** — тренажёр для отработки **счёта карт** в блэкджеке (очко/21). Он нужен, чтобы тренироваться дома, а не за столом в казино на реальные деньги.

Если вы не знакомы с блэкджеком — коротко:

- Блэкджек — карточная игра, где нужно набрать сумму очков как можно ближе к 21, не превысив её.
- **Счёт карт** — легальная техника, при которой игрок в уме отслеживает, какие карты уже вышли из колоды. Каждой вышедшей карте присваивается небольшое значение (например, +1, 0 или −1), и игрок держит в уме сумму — «счёт». Чем выше счёт, тем больше в оставшейся колоде «сильных» карт (тузов и десяток), что даёт статистическое преимущество игроку.
- Эта техника работает только там, где карты сдаются из физической колоды («шу») до специальной карты-среза, а не там, где стоит автоматический шаффлер (CSM) — устройство, перемешивающее карты после каждой раздачи. Автошаффлер делает счёт карт бессмысленным, потому что колода «обнуляется» после каждого раунда.

Этот тренажёр специально имитирует условия стола **без автошаффлера**: колода тасуется один раз и разыгрывается до среза, как за настоящим столом.

### Как работает тренажёр

1. Вы настраиваете параметры игры: количество колод в шу (6 или 8), глубину среза (сколько колод «срезается» и не разыгрывается), систему счёта и количество активных боксов (мест игроков за столом).
2. Нажимаете «Начать игру» — приложение тасует колоду и начинает раздавать карты раунд за раундом, как дилер за столом.
3. После каждой раздачи нужно ввести число — ваш текущий счёт по выбранной системе.
4. Приложение сверяет ваш ответ с правильным значением и считает точность (% правильных ответов) за всю колоду.

### Системы счёта

- **High-Low** — самая простая и распространённая система: картам 2–6 присваивается +1, картам 7–9 — 0, картам 10–туз — −1.
- **Omega II** — более сложная система с более точными весами (+2, +1, 0, −1, −2), даёт более точную оценку, но сложнее в освоении.

### Запуск проекта

**Требования:** установленный [Node.js](https://nodejs.org/) версии 18 или новее (в комплекте идёт `npm`).

```bash
# 1. Установить зависимости (один раз)
npm install

# 2. Запустить в режиме разработки
npm run dev
```

После запуска в терминале появится адрес (обычно `http://localhost:5173`) — откройте его в браузере.

Другие полезные команды:

```bash
# Собрать продакшен-версию (появится в папке dist/)
npm run build

# Локально просмотреть собранную версию
npm run preview
```

### Открыть на телефоне

Приложение поддерживает установку на домашний экран как PWA (прогрессивное веб-приложение):

- **iOS (Safari):** откройте сайт → кнопка «Поделиться» → «На экран «Домой»».
- **Android (Chrome):** откройте сайт → меню (три точки) → «Установить приложение».

---

## English

### What this is

**Blackjack Trainer** is a training tool for practicing **card counting** in blackjack (21). It lets you practice at home instead of at a real casino table with real money on the line.

If you're not familiar with blackjack, here's the short version:

- Blackjack is a card game where you try to get a hand total as close to 21 as possible without going over.
- **Card counting** is a legal technique where a player mentally tracks which cards have already been dealt. Each card is assigned a small value (for example +1, 0, or −1), and the player keeps a running sum — the "count." A higher count means more high-value cards (aces and tens) remain in the deck, which gives the player a statistical edge.
- This technique only works where cards are dealt from a physical shoe down to a cut card — not where a continuous shuffling machine (CSM) is used. A CSM reshuffles the deck after every hand, which "resets" the count and makes counting useless.

This trainer specifically simulates a table **without a CSM**: the shoe is shuffled once and played all the way down to the cut card, just like a real table.

### How the trainer works

1. You configure the game: how many decks are in the shoe (6 or 8), how deep the cut is (how many decks are set aside unplayed), which counting system to use, and how many player boxes (seats) are active at the table.
2. You click "Начать игру" (Start Game) — the app shuffles the shoe and starts dealing round by round, just like a real dealer would.
3. After each round, you enter a number — your current running count under the chosen system.
4. The app checks your answer against the correct value and tracks your accuracy (% correct) across the whole shoe.

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
