import { X } from "lucide-react";

const AddFriendModal = ({
  email,
  onEmailChange,
  error,
  loading,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <h2>Add Friend</h2>
        <p>Enter your friend's email to send a request.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email address"
          disabled={loading}
        />
        {error && <p className="alert-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn-reject" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-accept" onClick={onSubmit} disabled={loading}>
            {loading ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
