export type Language = "ru" | "en";

export interface HelpSection {
  title: string;
  body: string;
}

export interface Strings {
  appSubtitle: string;

  statRound: string;
  statAccuracy: string;
  statCardsLeft: string;
  statSystem: string;

  welcomeTitle: string;
  welcomeSubtitle: string;
  btnSettings: string;
  btnHistory: string;
  btnHelp: string;
  btnStart: string;

  dealerLabel: string;
  sumLabel: string;
  boxLabel: string;
  handLabel: string;

  statusStood: string;
  statusBust: string;
  statusBlackjack: string;
  doubledTag: string;

  btnHit: string;
  btnStand: string;
  btnDouble: string;
  btnSplit: string;

  countPrompt: string;
  countPlaceholder: string;
  btnCheck: string;

  resultCorrect: string;
  resultIncorrect: string;
  yourAnswer: string;
  correctCount: string;

  btnNextRound: string;
  btnNewGame: string;

  referenceTitle: string;
  highLowName: string;
  highLowDesc: string;
  omegaName: string;
  omegaDesc: string;

  settingsTitle: string;
  settingsLockedNotice: string;
  numDecksLabel: string;
  deckOption6: string;
  deckOption8: string;
  cutCardsLabel: string;
  cutOption1_5: string;
  cutOption2: string;
  cutOption3: string;
  cutOption4: string;
  cutOption5: string;
  countingSystemLabel: string;
  highLowOptionLabel: string;
  omegaOptionLabel: string;
  positionsLabel: string;
  autoAdvanceLabel: string;
  autoAdvanceHint: string;
  dealerH17Label: string;
  dealerH17HintOn: string;
  dealerH17HintOff: string;
  maxSplitLabel: string;
  maxSplitOption2: string;
  maxSplitOption3: string;
  maxSplitOption4: string;
  maxSplitOptionUnlimited: string;
  maxSplitHint: string;
  cancel: string;
  apply: string;

  historyTitle: string;
  historyEmpty: string;
  historyAllTimeAccuracyPrefix: string;
  shoeSingular: string;
  shoePlural: string;
  roundsSuffix: string;
  close: string;
  clearHistory: string;
  confirmClearBtn: string;

  deckEmptyPrefix: string;
  ok: string;

  helpTitle: string;
  helpSections: HelpSection[];
}

export const STRINGS: Record<Language, Strings> = {
  ru: {
    appSubtitle: "Тренировка счета карт",

    statRound: "Раунд",
    statAccuracy: "Точность",
    statCardsLeft: "Карт осталось",
    statSystem: "Система",

    welcomeTitle: "Добро пожаловать в тренер блэкджека!",
    welcomeSubtitle: "Настройте параметры игры и начните тренировку счета карт",
    btnSettings: "Настройки",
    btnHistory: "История",
    btnHelp: "Помощь",
    btnStart: "Начать игру",

    dealerLabel: "Дилер",
    sumLabel: "Сумма",
    boxLabel: "Бокс",
    handLabel: "Рука",

    statusStood: "Стоп",
    statusBust: "Перебор",
    statusBlackjack: "Блэкджек!",
    doubledTag: "(х2)",

    btnHit: "Взять",
    btnStand: "Стоп",
    btnDouble: "Х2",
    btnSplit: "Сплит",

    countPrompt: "Введите текущий счет:",
    countPlaceholder: "Ваш счет",
    btnCheck: "Проверить",

    resultCorrect: "✓ Правильно!",
    resultIncorrect: "✗ Неправильно",
    yourAnswer: "Ваш ответ",
    correctCount: "Правильный счет",

    btnNextRound: "Следующий раунд",
    btnNewGame: "Новая игра",

    referenceTitle: "Системы счета карт:",
    highLowName: "High-Low:",
    highLowDesc: "2-6: +1, 7-9: 0, 10-A: -1",
    omegaName: "Omega II:",
    omegaDesc: "2,3,7: +1, 4,5,6: +2, 8,A: 0, 9: -1, 10,J,Q,K: -2",

    settingsTitle: "Настройки игры",
    settingsLockedNotice:
      "Число колод, глубина среза и система счёта фиксируются на время игры — доступны только для новой игры.",
    numDecksLabel: "Количество колод:",
    deckOption6: "6 колод",
    deckOption8: "8 колод",
    cutCardsLabel: "Срезанные колоды:",
    cutOption1_5: "1.5 колоды",
    cutOption2: "2 колоды",
    cutOption3: "3 колоды",
    cutOption4: "4 колоды",
    cutOption5: "5 колод",
    countingSystemLabel: "Система счета:",
    highLowOptionLabel: "High-Low (+1, 0, -1)",
    omegaOptionLabel: "Omega II (+2, +1, 0, -1, -2)",
    positionsLabel: "Позиции игроков:",
    autoAdvanceLabel: "Автоматически переходить к следующему раунду",
    autoAdvanceHint:
      "После проверки счёта нужно будет нажимать «Следующий раунд» самостоятельно.",
    dealerH17Label: "Дилер добирает карту на мягком 17 (H17)",
    dealerH17HintOn: "Дилер берёт ещё карту при мягком 17 (например, туз + 6).",
    dealerH17HintOff: "Дилер останавливается на 17, включая мягкое (по умолчанию).",
    maxSplitLabel: "Максимум рук после сплита:",
    maxSplitOption2: "2 руки (пересплит запрещён)",
    maxSplitOption3: "3 руки",
    maxSplitOption4: "4 руки (по умолчанию)",
    maxSplitOptionUnlimited: "Без ограничений",
    maxSplitHint:
      "Пара внутри бокса даёт «Сплит»: рука делится на две, каждая получает свою карту. Если в одной из новых рук снова пара — её тоже можно сплитовать, пока не будет достигнут лимит.",
    cancel: "Отмена",
    apply: "Применить",

    historyTitle: "История сессий",
    historyEmpty:
      "Пока нет завершённых колод. Доиграйте колоду до конца или нажмите «Новая игра» во время игры — появится первая запись.",
    historyAllTimeAccuracyPrefix: "Средняя точность за всё время:",
    shoeSingular: "колода",
    shoePlural: "колод",
    roundsSuffix: "раунд(ов)",
    close: "Закрыть",
    clearHistory: "Очистить историю",
    confirmClearBtn: "Точно очистить",

    deckEmptyPrefix: "Колода закончилась! Точность за игру:",
    ok: "Ок",

    helpTitle: "Как пользоваться тренажёром",
    helpSections: [
      {
        title: "Что такое счёт карт",
        body: "Счёт карт — легальная техника: вы в уме отслеживаете, какие карты уже вышли из колоды, чтобы понять, сколько «сильных» карт (тузов и десяток) осталось. Она работает только за столом без автошаффлера — колода тасуется один раз и разыгрывается до карты среза, именно так, как устроен этот тренажёр.",
      },
      {
        title: "Как начать",
        body: "Откройте «Настройки», выберите число колод, систему счёта и активные боксы (места за столом), затем нажмите «Начать игру» — первый раунд раздастся сразу же.",
      },
      {
        title: "Как играть раунд",
        body: "У дилера одна карта открыта, вторая — закрыта. Для каждого активного бокса по очереди доступны кнопки: «Взять» (ещё карта), «Стоп» (закончить руку), «Х2» (ровно одна карта и автостоп — только пока в руке две карты), «Сплит» (если в руке пара — разделить её на две руки; если в новой руке снова выпадет пара, сплитовать можно ещё раз).",
      },
      {
        title: "Ход дилера и проверка счёта",
        body: "Когда все боксы доиграны, дилер открывает вторую карту и добирает по правилам (настраивается в «Настройках» — H17/S17). После этого введите текущий счёт по выбранной системе — сумму значений всех карт, вышедших с начала колоды, — и нажмите «Проверить».",
      },
      {
        title: "Точность и история",
        body: "Каждый ответ учитывается в счётчике точности вверху экрана. Когда колода заканчивается (или вы нажимаете «Новая игра»), результат сохраняется в «Истории» — там же видна средняя точность за всё время и список прошлых сессий.",
      },
    ],
  },
  en: {
    appSubtitle: "Card counting practice",

    statRound: "Round",
    statAccuracy: "Accuracy",
    statCardsLeft: "Cards left",
    statSystem: "System",

    welcomeTitle: "Welcome to the Blackjack Trainer!",
    welcomeSubtitle: "Configure the game settings and start practicing your count",
    btnSettings: "Settings",
    btnHistory: "History",
    btnHelp: "Help",
    btnStart: "Start Game",

    dealerLabel: "Dealer",
    sumLabel: "Total",
    boxLabel: "Box",
    handLabel: "Hand",

    statusStood: "Stand",
    statusBust: "Bust",
    statusBlackjack: "Blackjack!",
    doubledTag: "(x2)",

    btnHit: "Hit",
    btnStand: "Stand",
    btnDouble: "Double",
    btnSplit: "Split",

    countPrompt: "Enter the current count:",
    countPlaceholder: "Your count",
    btnCheck: "Check",

    resultCorrect: "✓ Correct!",
    resultIncorrect: "✗ Incorrect",
    yourAnswer: "Your answer",
    correctCount: "Correct count",

    btnNextRound: "Next Round",
    btnNewGame: "New Game",

    referenceTitle: "Counting systems:",
    highLowName: "High-Low:",
    highLowDesc: "2-6: +1, 7-9: 0, 10-A: -1",
    omegaName: "Omega II:",
    omegaDesc: "2,3,7: +1, 4,5,6: +2, 8,A: 0, 9: -1, 10,J,Q,K: -2",

    settingsTitle: "Game settings",
    settingsLockedNotice:
      "Number of decks, penetration, and counting system are locked for the duration of the game — only available before starting a new game.",
    numDecksLabel: "Number of decks:",
    deckOption6: "6 decks",
    deckOption8: "8 decks",
    cutCardsLabel: "Cut cards:",
    cutOption1_5: "1.5 decks",
    cutOption2: "2 decks",
    cutOption3: "3 decks",
    cutOption4: "4 decks",
    cutOption5: "5 decks",
    countingSystemLabel: "Counting system:",
    highLowOptionLabel: "High-Low (+1, 0, -1)",
    omegaOptionLabel: "Omega II (+2, +1, 0, -1, -2)",
    positionsLabel: "Player positions:",
    autoAdvanceLabel: "Automatically advance to the next round",
    autoAdvanceHint:
      "After checking your count, you'll need to click \"Next Round\" yourself.",
    dealerH17Label: "Dealer hits soft 17 (H17)",
    dealerH17HintOn: "The dealer takes another card on soft 17 (e.g. Ace + 6).",
    dealerH17HintOff: "The dealer stands on 17, including soft 17 (default).",
    maxSplitLabel: "Max hands after split:",
    maxSplitOption2: "2 hands (no resplitting)",
    maxSplitOption3: "3 hands",
    maxSplitOption4: "4 hands (default)",
    maxSplitOptionUnlimited: "No limit",
    maxSplitHint:
      "A pair in a box enables \"Split\": the hand splits into two, each getting its own card. If one of the new hands is a pair again, it can be split once more, up to the limit.",
    cancel: "Cancel",
    apply: "Apply",

    historyTitle: "Session history",
    historyEmpty:
      "No completed shoes yet. Play a shoe all the way through, or click \"New Game\" mid-game — the first entry will appear here.",
    historyAllTimeAccuracyPrefix: "All-time average accuracy:",
    shoeSingular: "shoe",
    shoePlural: "shoes",
    roundsSuffix: "round(s)",
    close: "Close",
    clearHistory: "Clear history",
    confirmClearBtn: "Yes, clear it",

    deckEmptyPrefix: "Shoe is empty! Accuracy this session:",
    ok: "OK",

    helpTitle: "How to use this trainer",
    helpSections: [
      {
        title: "What card counting is",
        body: "Card counting is a legal technique: you mentally track which cards have already come out of the shoe to estimate how many \"strong\" cards (aces and tens) remain. It only works at a table without a continuous shuffler — the shoe is shuffled once and played all the way down to the cut card, exactly how this trainer works.",
      },
      {
        title: "Getting started",
        body: "Open \"Settings\", choose the number of decks, counting system, and active boxes (seats at the table), then click \"Start Game\" — the first round is dealt immediately.",
      },
      {
        title: "Playing a round",
        body: "The dealer shows one card face up and one face down. Each active box, in turn, gets buttons: \"Hit\" (another card), \"Stand\" (finish the hand), \"Double\" (exactly one more card and an automatic stand — only while the hand has two cards), \"Split\" (if the hand is a pair, split it into two hands; if a new hand pairs up again, it can be split again).",
      },
      {
        title: "Dealer's turn and checking your count",
        body: "Once every box is done, the dealer reveals the hidden card and draws according to the rules (configurable in \"Settings\" — H17/S17). Then enter the current count under the chosen system — the sum of every card's value since the shoe started — and click \"Check\".",
      },
      {
        title: "Accuracy and history",
        body: "Every answer counts toward the accuracy stat at the top of the screen. When the shoe runs out (or you click \"New Game\"), the result is saved to \"History\" — which also shows your all-time average accuracy and a list of past sessions.",
      },
    ],
  },
};

const LANGUAGE_KEY = "blackjack-trainer:language";

export const loadLanguage = (): Language => {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY);
    return raw === "en" || raw === "ru" ? raw : "ru";
  } catch {
    return "ru";
  }
};

export const saveLanguage = (language: Language) => {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // хранилище недоступно — просто не сохраняем
  }
};
