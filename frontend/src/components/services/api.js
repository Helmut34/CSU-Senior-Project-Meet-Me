export const authAPI = {
  async login(email, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  async register(email, password, username) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    return data;
  },

  async logout() {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Logout failed");
    return data;
  },

  async me() {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get user");
    return data;
  },
};

export const locationAPI = {
  async saveLocation(lat, lon, address) {
    const res = await fetch("/api/location/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ lat, lon, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save location");
    return data;
  },
};

export const friendAPI = {
  async getFriends() {
    const res = await fetch("/api/friends/", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get friends");
    return data;
  },

  async addFriend(friend_email) {
    const res = await fetch("/api/friends/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ friend_email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add friend");
    return data;
  },

  async getPendingRequests() {
    const res = await fetch("/api/friends/requests", {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get requests");
    return data;
  },

  async acceptFriend(request_id) {
    const res = await fetch("/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ request_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to accept");
    return data;
  },

  async rejectFriend(request_id) {
    const res = await fetch("/api/friends/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ request_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to decline");
    return data;
  },
};

export const partyAPI = {
  async createParty(friends_ids) {
    const res = await fetch("/api/party/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ friends_ids }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create party");
    return data;
  },

  async getPendingInvites() {
    const res = await fetch("/api/parties/invites", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get invites");
    return data;
  },

  async acceptInvite(inviteId) {
    const res = await fetch(`/api/parties/invites/${inviteId}/accept`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to accept invite");
    return data;
  },

  async rejectInvite(inviteId) {
    const res = await fetch(`/api/parties/invites/${inviteId}/reject`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reject invite");
    return data;
  },

  async getActiveParty() {
    const res = await fetch("/api/parties/active", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No active party");
    return data;
  },

  async getParty(partyId) {
    const res = await fetch(`/api/parties/${partyId}`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get party");
    return data;
  },

  async leaveParty(party_id) {
    const res = await fetch("/api/parties/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ party_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to leave party");
    return data;
  },

  async getPartyMidpoint(partyId) {
    const res = await fetch(`/api/parties/${partyId}/midpoint`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get midpoint");
    return data;
  },

  async voteForVenue(partyId, venue_place_id, venue_name, venue_address) {
    const res = await fetch(`/api/parties/${partyId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ venue_place_id, venue_name, venue_address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to vote");
    return data;
  },

  async getVotes(partyId) {
    const res = await fetch(`/api/parties/${partyId}/votes`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get votes");
    return data;
  },

  async finalizeVenue(partyId, meeting_date) {
    const res = await fetch(`/api/parties/${partyId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ meeting_date }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to finalize");
    return data;
  },
};

export const questionnaireAPI = {
  async submitQuestionnaire(partyId, formData) {
    const res = await fetch(`/api/parties/${partyId}/questionnaire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Failed to submit questionnaire");
    return data;
  },

  async getQuestionnaire(partyId) {
    const res = await fetch(`/api/parties/${partyId}/questionnaire`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get questionnaire");
    return data;
  },

  async getMatchedVenues(partyId) {
    const res = await fetch(`/api/parties/${partyId}/matched-venues`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get matched venues");
    return data;
  },
};

export const venueAPI = {
  async searchVenues(latitude, longitude, radius, type, keyword, budget) {
    const res = await fetch("/api/venues/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        latitude,
        longitude,
        radius,
        type,
        keyword,
        budget,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to search venues");
    return data;
  },
};
