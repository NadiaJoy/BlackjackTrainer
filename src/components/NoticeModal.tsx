const NoticeModal = ({
  message,
  okLabel,
  onClose,
}: {
  message: string;
  okLabel: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-gray-900 text-center">
      <p className="mb-6">{message}</p>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        {okLabel}
      </button>
    </div>
  </div>
);

export default NoticeModal;
