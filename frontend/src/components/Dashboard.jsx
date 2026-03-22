import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Users,
  LogOut,
  Check,
  Calendar,
  ArrowRight,
} from "lucide-react";
import LocationInput from "./LocationInput";
import LocationMap from "./LocationMap";
import PartyInvitesModal from "./PartyInvitesModal";
import FriendRequestsModal from "./FriendRequestsModal";
import CreateMeetupModal from "./CreateMeetupModal";
import AddFriendModal from "./AddFriendModal";
import toast from "react-hot-toast";
import { authAPI, friendAPI, partyAPI } from "./services/api";
import "./css/Dashboard.css";

const Dashboard = ({ user, onLogout, userLocation, onLocationFound }) => {
  const navigate = useNavigate();

  const [friendsList, setFriendsList] = useState([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [pickedForMeetup, setPickedForMeetup] = useState([]);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [fetchingRequests, setPullingRequests] = useState(false);

  const [partyInvites, setPartyInvites] = useState([]);
  const [fetchingInvites, setPullingInvites] = useState(false);

  const [activeParty, setActiveParty] = useState(null);
  const [sendingInvites, setSendingInvites] = useState(false);

  // which modal is currently open (only one at a time)
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [addFriendError, setAddFriendError] = useState(null);

  async function fetchFriendsList() {
    try {
      setFriendsLoaded(false);
      const data = await friendAPI.getFriends();
      setFriendsList(data);
    } catch {
      // silent fail since we dont know if user has friends yet
    } finally {
      setFriendsLoaded(true);
    }
  }

  // these two can fail silently
  async function fetchRequests() {
    try {
      setPullingRequests(true);
      setPendingRequests(await friendAPI.getPendingRequests());
    } catch {
    } finally {
      setPullingRequests(false);
    }
  }

  async function fetchPartyInvites() {
    try {
      setPullingInvites(true);
      setPartyInvites(await partyAPI.getPendingInvites());
    } catch {
    } finally {
      setPullingInvites(false);
    }
  }

  async function fetchActiveParty() {
    try {
      setActiveParty(await partyAPI.getActiveParty());
    } catch {
      // 404 just means no active party right now
      setActiveParty(null);
    }
  }

  // grab only what's visible on first render
  useEffect(() => {
    fetchFriendsList();
    fetchActiveParty();
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      toast.success("Logged out successfully");
    } catch {
      // still log out on the frontend even if the request fails
    }
    onLogout();
    navigate("/");
  };

  // toggle a friend in/out of the meetup selection
  const toggleMeetupPick = (fid) => {
    setPickedForMeetup((prev) =>
      prev.includes(fid) ? prev.filter((id) => id !== fid) : [...prev, fid],
    );
  };

  const sendMeetupInvites = async () => {
    try {
      setSendingInvites(true);
      await partyAPI.createParty(pickedForMeetup);
      toast.success("Invites are out!");
      setPickedForMeetup([]);
      setShowInviteModal(false);
      await fetchActiveParty();
    } catch (err) {
      toast.error(err.message || "Couldn't send invitestry again");
    } finally {
      setSendingInvites(false);
    }
  };

  const acceptFriendReq = async (requestId) => {
    try {
      await friendAPI.acceptFriend(requestId);
      toast.success("You're now friends!");
      // refresh both lists in parallel
      await Promise.all([fetchRequests(), fetchFriendsList()]);
    } catch {
      toast.error("Couldn't accept that request");
    }
  };

  const declineFriendReq = async (requestId) => {
    try {
      await friendAPI.rejectFriend(requestId);
      await fetchRequests();
    } catch {
      toast.error("Couldn't decline that request");
    }
  };

  const acceptPartyInvite = async (inviteId, partyId) => {
    try {
      await partyAPI.acceptInvite(inviteId);
      toast.success("Youre in!");
      await Promise.all([fetchPartyInvites(), fetchActiveParty()]); //Now parallel
      setShowPartyModal(false);
      navigate(`/party/${partyId}`);
    } catch {
      toast.error("Couldn't accept that invite");
    }
  };

  const submitAddFriend = async () => {
    if (!friendEmail.trim()) return;
    try {
      setAddingFriend(true);
      setAddFriendError(null);
      await friendAPI.addFriend(friendEmail.trim());
      toast.success("Request sent!");
      setFriendEmail("");
      setShowAddFriendModal(false);
    } catch (err) {
      // show the backend message
      setAddFriendError(err.message);
    } finally {
      setAddingFriend(false);
    }
  };

  const declinePartyInvite = async (inviteId) => {
    try {
      await partyAPI.rejectInvite(inviteId);
      await fetchPartyInvites();
    } catch {
      toast.error("Couldn't decline that invite");
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Meet me in the middle - Your Dashboard</h1>
          <div className="header-right">
            <span className="user-email">{user.username || user.email}</span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {activeParty && (
          <div className="section active-party-section">
            <div className="section-header">
              <Users size={24} />
              <h2 className="section-title">Active Party</h2>
            </div>
            <div className="active-party-content">
              <p>
                You have an active party with{" "}
                {activeParty.host.username || activeParty.host.email}
                {activeParty.invitees.length > 0 &&
                  ` and ${activeParty.invitees.length} other${activeParty.invitees.length > 1 ? "s" : ""}`}
              </p>
              <button
                onClick={() => navigate(`/party/${activeParty.party_id}`)}
                className="btn-view-party"
              >
                <span>View Party Details</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-header">
            <MapPin size={24} />
            <h2 className="section-title">Your Location</h2>
          </div>
          <LocationInput onLocationFound={onLocationFound} />
        </div>

        <div className="section">
          <div className="section-header">
            <MapPin size={24} />
            <h2 className="section-title">Location Map</h2>
          </div>
          <LocationMap userLocation={userLocation} />
        </div>

        <div className="section">
          <div className="section-header">
            <Users size={24} />
            <h2 className="section-title">Your Friends</h2>
            <button
              className="btn-add-friend"
              onClick={() => {
                setShowPartyModal(true);
                fetchPartyInvites();
              }}
            >
              Party Invites
              {partyInvites.length > 0 && (
                <span className="notification-badge">
                  {partyInvites.length}
                </span>
              )}
            </button>
            <button
              className="btn-add-friend"
              onClick={() => {
                setShowRequestsModal(true);
                fetchRequests();
              }}
            >
              Requests
              {pendingRequests.length > 0 && (
                <span className="notification-badge">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {!friendsLoaded ? (
            <p>Loading friends...</p>
          ) : friendsList.length === 0 ? (
            <p>No friends yet. Add some to get started!</p>
          ) : (
            <div className="friends-list">
              {friendsList.map((f) => (
                <div
                  key={f.id}
                  className={`friend-item ${pickedForMeetup.includes(f.id) ? "selected" : ""}`}
                  onClick={() => toggleMeetupPick(f.id)}
                >
                  <div className="friend-item-left">
                    <div
                      className={`checkbox ${pickedForMeetup.includes(f.id) ? "checked" : ""}`}
                    >
                      {pickedForMeetup.includes(f.id) && <Check size={16} />}
                    </div>
                    <span>{f.username || f.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn-add-friend"
            onClick={() => setShowAddFriendModal(true)}
          >
            + Add Friend
          </button>
        </div>

        {pickedForMeetup.length > 0 && (
          <div className="invite-actions">
            <button
              className="btn-large"
              onClick={() => setShowInviteModal(true)}
            >
              <Calendar size={20} />
              <span>
                Invite {pickedForMeetup.length} Friend
                {pickedForMeetup.length > 1 ? "s" : ""} to Meet
              </span>
            </button>
          </div>
        )}
      </div>

      {showPartyModal && (
        <PartyInvitesModal
          invites={partyInvites}
          loading={fetchingInvites}
          onAccept={acceptPartyInvite}
          onReject={declinePartyInvite}
          onClose={() => setShowPartyModal(false)}
        />
      )}

      {showRequestsModal && (
        <FriendRequestsModal
          requests={pendingRequests}
          loading={fetchingRequests}
          onAccept={acceptFriendReq}
          onReject={declineFriendReq}
          onClose={() => setShowRequestsModal(false)}
        />
      )}

      {showInviteModal && (
        <CreateMeetupModal
          selectedCount={pickedForMeetup.length}
          sending={sendingInvites}
          onSend={sendMeetupInvites}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showAddFriendModal && (
        <AddFriendModal
          email={friendEmail}
          onEmailChange={setFriendEmail}
          error={addFriendError}
          loading={addingFriend}
          onSubmit={submitAddFriend}
          onClose={() => {
            setShowAddFriendModal(false);
            setFriendEmail("");
            setAddFriendError(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
