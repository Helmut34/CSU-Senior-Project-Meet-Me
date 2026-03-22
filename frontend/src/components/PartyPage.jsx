import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Users,
  X,
  Coffee,
  ArrowLeft,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { partyAPI, questionnaireAPI, venueAPI } from "./services/api";
import toast from "react-hot-toast";
import QuestionnaireWizard from "./Questionnaire";
import "./css/PartyPage.css";

// safe defaults from google maps, use as failsafe
const DEFAULT_PREFS = {
  budget: "medium",
  meeting_type: "casual",
  food_preferences: [],
  dietary_restrictions: [],
  atmosphere: "lively",
  venue_types: ["restaurant"],
  travel_weight: 1.0, // 1.0 = equal pull in the midpoint calc
};

const PartyPage = ({ user }) => {
  const { partyId } = useParams();
  const navigate = useNavigate();

  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [midpoint, setMidpoint] = useState(null);
  const [midpointCalculating, setMidpointCalculating] = useState(false);
  const [venues, setVenues] = useState([]);
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState(null);
  const [leavingParty, setLeavingParty] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");

  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_PREFS });
  const [submittingQuestionnaire, setSubmittingQuestionnaire] = useState(false);

  // pulls party info, venues, questionnaire, and votes in one trip
  async function loadEverything() {
    try {
      setLoading(true);
      setError(null);
      const partyData = await partyAPI.getParty(partyId);
      setParty(partyData);

      if (partyData.midpoint_latitude && partyData.midpoint_longitude) {
        setMidpoint({
          lat: partyData.midpoint_latitude,
          lon: partyData.midpoint_longitude,
        });

        // auto-load venues if midpoint already calculated
        try {
          const matchedData = await questionnaireAPI.getMatchedVenues(partyId);
          const params = matchedData.search_params || {};
          const venueResult = await venueAPI.searchVenues(
            partyData.midpoint_latitude,
            partyData.midpoint_longitude,
            params.radius || 5000,
            params.type || "restaurant",
            params.keyword || null,
            params.budget || null,
          );
          const venues = venueResult.venues || [];
          setVenues(venues);
          if (venues.length === 0) toast.error("No venues found");
        } catch {
          try {
            const venueResult = await venueAPI.searchVenues(
              partyData.midpoint_latitude,
              partyData.midpoint_longitude,
              5000,
              "restaurant",
            );
            const venues = venueResult.venues || [];
            setVenues(venues);
            if (venues.length === 0) toast.error("No venues found");
          } catch {}
        }
      }

      // fetch questionnaire and votes in (now parallel)
      const [qResult, voteResult] = await Promise.all([
        questionnaireAPI.getQuestionnaire(partyId).catch(() => null),
        partyAPI.getVotes(partyId).catch(() => null),
      ]);

      if (qResult?.budget) {
        setQuestionnaire(qResult);
        setFormData({
          budget: qResult.budget || "medium",
          meeting_type: qResult.meeting_type || "casual",
          food_preferences: qResult.food_preferences || [],
          dietary_restrictions: qResult.dietary_restrictions || [],
          atmosphere: qResult.atmosphere || "lively",
          venue_types: qResult.venue_types || ["restaurant"],
          travel_weight: qResult.travel_weight || 1.0,
        });
      } else {
        setShowQuestionnaire(true);
      }

      if (voteResult) {
        const voteLookup = {};
        (voteResult.votes || []).forEach((v) => {
          voteLookup[v.venue_place_id] = v.count;
        });
        setVotes(voteLookup);
        setMyVote(voteResult.my_vote);
      }
    } catch (err) {
      setError(
        err.message || "Couldn't load this party",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEverything();
  }, [partyId]);

  const handleSubmitQuestionnaire = async () => {
    try {
      setSubmittingQuestionnaire(true);
      await questionnaireAPI.submitQuestionnaire(partyId, formData);
      await loadEverything();
      setShowQuestionnaire(false);
      toast.success("Questionnaire submitted!");
    } catch (err) {
      toast.error(err.message || "Failed to submit questionnaire");
    } finally {
      setSubmittingQuestionnaire(false);
    }
  };

  const handleCalculateMidpoint = async () => {
    setMidpointCalculating(true);
    try {
      await partyAPI.getPartyMidpoint(partyId);
      toast.success("Midpoint calculated!");
      // loadEverything already fetches party + venues + questionnaire + votes
      await loadEverything();
    } catch (err) {
      toast.error(err.message || "Failed to calculate midpoint");
    } finally {
      setMidpointCalculating(false);
    }
  };

  const handleLeaveParty = async () => {
    try {
      setLeavingParty(true);
      await partyAPI.leaveParty(party.party_id);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to leave party");
    } finally {
      setLeavingParty(false);
    }
  };

  const handleVote = async (venue) => {
    try {
      await partyAPI.voteForVenue(
        partyId,
        venue.place_id,
        venue.name,
        venue.address,
      );
      setMyVote(venue.place_id);
      const voteData = await partyAPI.getVotes(partyId);
      const voteLookup = {};
      (voteData.votes || []).forEach((v) => {
        voteLookup[v.venue_place_id] = v.count;
      });
      setVotes(voteLookup);
      toast.success("Vote recorded!");
    } catch (err) {
      toast.error(err.message || "Failed to vote");
    }
  };

  const handleFinalize = async () => {
    try {
      const result = await partyAPI.finalizeVenue(partyId, meetingDate || null);
      toast.success(`Venue selected: ${result.selected_venue_name}`);
      if (result.calendar_url) {
        window.open(result.calendar_url, "_blank");
      }
      await loadEverything();
    } catch (err) {
      toast.error(err.message || "Failed to finalize");
    }
  };

  if (loading)
    return (
      <div className="party-page">
        <p>Loading party...</p>
      </div>
    );
  if (error)
    return (
      <div className="party-page">
        <p>{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-view-party"
        >
          Back to Dashboard
        </button>
      </div>
    );
  if (!party)
    return (
      <div className="party-page">
        <p>Party not found</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-view-party"
        >
          Back to Dashboard
        </button>
      </div>
    );

  return (
    <div className="party-page">
      <div className="party-header">
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-back-header"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="party-content-wrapper">
        {/* Party Info */}
        <div className="section">
          <div className="section-header">
            <Users size={24} />
            <h2>Party Members</h2>
          </div>
          <p>
            <strong>Host:</strong> {party.host.username || party.host.email}
          </p>
          <div className="party-members-badges">
            <span className="member-badge host-badge">
              {party.host.username || party.host.email}
            </span>
            {party.invitees.map((invitee) => (
              <span
                key={invitee.id}
                className={`member-badge ${invitee.status}`}
              >
                {invitee.invitee?.username || invitee.invitee?.email}
                {invitee.status === "accepted" && <CheckCircle size={14} />}
                {invitee.status === "pending" && " (Pending)"}
                {invitee.status === "declined" && " (Declined)"}
              </span>
            ))}
          </div>
        </div>
        {/* Questionnaire */}
        <div className="section">
          <div className="section-header">
            <CheckCircle size={24} />
            <h2>Your Questionnaire</h2>
          </div>
          {questionnaire ? (
            <>
              <p>Questionnaire completed!</p>
              <button
                className="btn-view-party"
                onClick={() => setShowQuestionnaire(true)}
              >
                Edit Questionnaire
              </button>
            </>
          ) : (
            <>
              <p>
                Please complete the questionnaire to help find the perfect spot!
              </p>
              <button
                className="btn-view-party"
                onClick={() => setShowQuestionnaire(true)}
              >
                Fill Out Questionnaire
              </button>
            </>
          )}
        </div>

        {/* Midpoint */}
        <div className="section">
          <div className="section-header">
            <MapPin size={24} />
            <h2>Meeting Point</h2>
          </div>
          {midpoint ? (
            <p>
              Lat: {midpoint.lat.toFixed(6)}, Lon: {midpoint.lon.toFixed(6)}
            </p>
          ) : (
            <p>Calculate the midpoint to find where everyone should meet!</p>
          )}
          <button
            onClick={handleCalculateMidpoint}
            disabled={midpointCalculating}
            className="btn-view-party"
          >
            <MapPin size={16} />
            {midpointCalculating
              ? "Calculating..."
              : midpoint
                ? "Recalculate"
                : "Calculate Midpoint"}
          </button>
        </div>

        {/* Venues */}
        {midpoint && venues.length > 0 && (
          <div className="section">
            <div className="section-header">
              <Coffee size={24} />
              <h2>Suggested Spots</h2>
            </div>
            <p>Click a venue to vote for it</p>
            <div className="venue-list">
              {venues.map((venue, i) => (
                <div
                  key={venue.place_id || i}
                  className={`venue-card ${myVote === venue.place_id ? "venue-card-voted" : ""}`}
                  onClick={() => handleVote(venue)}
                >
                  <div className="venue-name">
                    {venue.name}
                    {votes[venue.place_id] > 0 && (
                      <span className="vote-count">
                        {votes[venue.place_id]} vote
                        {votes[venue.place_id] !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="venue-address">{venue.address}</div>
                  {venue.rating && (
                    <span className="venue-rating">Rating: {venue.rating}</span>
                  )}
                  {venue.price_level && (
                    <span className="venue-price">
                      {" "}
                      {"$".repeat(venue.price_level)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Venue */}
        {party.selected_venue_name && (
          <div className="section active-party-section">
            <p>
              <strong>{party.selected_venue_name}</strong>
            </p>
            {party.calendar_url && (
              <a
                href={party.calendar_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-view-party"
              >
                Add to Google Calendar
              </a>
            )}
          </div>
        )}

        {/* Finalize (host only) */}
        {midpoint &&
          venues.length > 0 &&
          party.host.id === user.id &&
          !party.selected_venue_name && (
            <div className="section">
              <div className="section-header">
                <Calendar size={24} />
                <h2>Finalize Meeting</h2>
              </div>
              <label>
                Meeting Date & Time
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={handleFinalize}
                className="btn-view-party"
              >
                Finalize Venue
              </button>
            </div>
          )}

        {/* Leave */}
        <div className="party-actions">
          <button
            onClick={handleLeaveParty}
            disabled={leavingParty}
            className="btn-leave-party"
          >
            <X size={16} />
            {leavingParty ? "Leaving..." : "Leave Party"}
          </button>
        </div>
      </div>

      {showQuestionnaire && (
        <QuestionnaireWizard
          formData={formData}
          setFormData={setFormData}
          questionnaire={questionnaire}
          onSubmit={handleSubmitQuestionnaire}
          onClose={() => setShowQuestionnaire(false)}
          submitting={submittingQuestionnaire}
        />
      )}
    </div>
  );
};

export default PartyPage;
