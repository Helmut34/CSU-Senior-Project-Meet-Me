import { X, Check } from "lucide-react";

const PartyInvitesModal = ({
  invites,
  loading,
  onAccept,
  onReject,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <div>
          <h2>Party Invites</h2>
          {loading ? (
            <p>Loading invites...</p>
          ) : invites.length === 0 ? (
            <p>No pending party invites</p>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="friend-request-item">
                <div>
                  <strong>{invite.host.username || invite.host.email}</strong>
                  <p>Invited you to meet up</p>
                </div>
                <div className="request-actions">
                  <button
                    className="btn-accept"
                    onClick={() => onAccept(invite.id, invite.party_id)}
                  >
                    <Check size={16} /> Accept
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => onReject(invite.id)}
                  >
                    <X size={16} /> Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyInvitesModal;
