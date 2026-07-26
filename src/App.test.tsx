import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlackjackTrainer from "./App";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("starting a game", () => {
  it("deals the first round immediately, no extra click needed", async () => {
    render(<BlackjackTrainer />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Начать игру" }));

    expect(screen.getByText("Дилер")).toBeInTheDocument();
    // Default settings play boxes 1-3.
    expect(screen.getByText("Бокс 1")).toBeInTheDocument();
    expect(screen.getByText("Бокс 2")).toBeInTheDocument();
    expect(screen.getByText("Бокс 3")).toBeInTheDocument();
    expect(screen.getByText("Раунд")).toBeInTheDocument();
  });
});

describe("playing a round through to the count check", () => {
  it(
    "reaches the count prompt and reports a result after standing on every box",
    async () => {
      render(<BlackjackTrainer />);
      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: "Начать игру" }));

      // Stand on whichever hand is currently active until the dealer's
      // turn takes over (naturals are skipped automatically).
      for (let guard = 0; guard < 10; guard++) {
        const standButton = screen.queryByRole("button", { name: "Стоп" });
        if (!standButton) break;
        await user.click(standButton);
      }

      await waitFor(
        () => expect(screen.getByText("Введите текущий счет:")).toBeInTheDocument(),
        { timeout: 10000 }
      );

      await user.type(screen.getByPlaceholderText("Ваш счет"), "0");
      await user.click(screen.getByRole("button", { name: "Проверить" }));

      expect(
        screen.getByText((text) => text.includes("Правильно") || text.includes("Неправильно"))
      ).toBeInTheDocument();
      expect(screen.getByText(/Ваш ответ/)).toBeInTheDocument();
    },
    15000
  );
});

describe("settings", () => {
  it("applies a changed setting and closes the modal", async () => {
    render(<BlackjackTrainer />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Настройки" }));
    expect(screen.getByText("Настройки игры")).toBeInTheDocument();

    await user.selectOptions(screen.getByDisplayValue("6 колод"), "8");
    await user.click(screen.getByRole("button", { name: "Применить" }));

    expect(screen.queryByText("Настройки игры")).not.toBeInTheDocument();
  });
});

describe("revealing the running count", () => {
  it("is hidden by default and toggles on request", async () => {
    render(<BlackjackTrainer />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Начать игру" }));

    expect(screen.queryByText(/Текущий счёт/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Показать счёт" }));
    expect(screen.getByText(/Текущий счёт/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Скрыть счёт" }));
    expect(screen.queryByText(/Текущий счёт/)).not.toBeInTheDocument();
  });
});

describe("history", () => {
  it("shows the empty state before any shoe has been completed", async () => {
    render(<BlackjackTrainer />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "История" }));

    expect(screen.getByText(/Пока нет завершённых колод/)).toBeInTheDocument();
  });
});
