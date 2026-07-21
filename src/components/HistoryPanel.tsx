import { useState } from "react";
import type { Language, Strings } from "../i18n";
import { formatSessionDate } from "../storage";
import type { SessionRecord } from "../types";

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

export default HistoryPanel;
