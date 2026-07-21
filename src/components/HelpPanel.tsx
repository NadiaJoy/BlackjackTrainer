import type { Strings } from "../i18n";

const HelpPanel = ({ t, onClose }: { t: Strings; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-gray-900 max-h-[85vh] flex flex-col">
      <h3 className="text-xl font-bold mb-4">{t.helpTitle}</h3>
      <div className="overflow-y-auto flex-1 space-y-4 mb-4">
        {t.helpSections.map((section, idx) => (
          <div key={idx}>
            <h4 className="font-bold mb-1">{section.title}</h4>
            <p className="text-sm text-gray-700">{section.body}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {t.close}
      </button>
    </div>
  </div>
);

export default HelpPanel;
