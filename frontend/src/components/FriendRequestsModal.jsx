import { X, Check } from "lucide-react";

const FriendRequestsModal = ({
  requests,
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
          <h2>Friend Requests</h2>
          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p>No pending friend requests</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="friend-request-item">
                <span>{req.user.username || req.user.email}</span>
                <div className="request-actions">
                  <button
                    className="btn-accept"
                    onClick={() => onAccept(req.id)}
                  >
                    <Check size={16} /> Accept
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => onReject(req.id)}
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

export default FriendRequestsModal;
