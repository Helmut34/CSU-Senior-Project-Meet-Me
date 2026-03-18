import { X } from "lucide-react";

const CreateMeetupModal = ({ selectedCount, sending, onSend, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <div>
          <h2>Create Meetup</h2>
          <p>
            You're inviting {selectedCount} friend{selectedCount > 1 ? "s" : ""}{" "}
            to meet up!
          </p>
          <div className="modal-actions">
            <button className="btn-reject" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button className="btn-accept" onClick={onSend} disabled={sending}>
              {sending ? "Sending..." : "Send Invites"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMeetupModal;
