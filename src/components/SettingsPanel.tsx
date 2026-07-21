import { useState } from "react";
import type { Strings } from "../i18n";
import { MAX_BOXES } from "../game";
import type { CountingSystem, GameSettings } from "../types";

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

export default SettingsPanel;
