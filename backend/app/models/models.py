import enum
from app import db
from flask_login import UserMixin


class FriendStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class InviteStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class User(db.Model, UserMixin):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(25), unique=True, nullable=True, index=True)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean(), default=True)

    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_address = db.Column(db.String(500), nullable=True)


class Friends(db.Model):
    __tablename__ = "friends"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )
    friend_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )
    status = db.Column(db.Enum(FriendStatus), default=FriendStatus.pending, index=True)

    user = db.relationship(
        "User", foreign_keys=[user_id], backref=db.backref("friends")
    )
    friend = db.relationship(
        "User", foreign_keys=[friend_id], backref=db.backref("received_requests")
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "friend_id", name="unique_friendship"),
    )


class Party(db.Model):
    __tablename__ = "party"

    id = db.Column(db.Integer, primary_key=True)
    host_user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )

    midpoint_latitude = db.Column(db.Float, nullable=True)
    midpoint_longitude = db.Column(db.Float, nullable=True)
    midpoint_address = db.Column(db.String(500), nullable=True)
    host_midpoint_weight = db.Column(db.Float, default=1.0, nullable=False)

    selected_venue_name = db.Column(db.String(255), nullable=True)
    selected_venue_address = db.Column(db.String(500), nullable=True)
    meeting_date = db.Column(db.DateTime, nullable=True, index=True)

    host = db.relationship(
        "User", foreign_keys=[host_user_id], backref=db.backref("hosted_parties")
    )
    invites = db.relationship(
        "PartyInvite", backref="party", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Party {self.id} hosted by {self.host_user_id}>"


class PartyInvite(db.Model):
    __tablename__ = "party_invite"

    id = db.Column(db.Integer, primary_key=True)
    party_id = db.Column(
        db.Integer, db.ForeignKey("party.id"), nullable=False, index=True
    )
    invitee_user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )
    status = db.Column(db.Enum(InviteStatus), default=InviteStatus.pending, index=True)
    midpoint_weight = db.Column(db.Float, default=1.0, nullable=False)

    invitee = db.relationship(
        "User", foreign_keys=[invitee_user_id], backref=db.backref("party_invites")
    )

    __table_args__ = (
        db.UniqueConstraint("party_id", "invitee_user_id", name="unique_party_invite"),
    )

    def __repr__(self):
        return f"<PartyInvite {self.id} for party {self.party_id}>"


class PartyQuestionnaire(db.Model):
    __tablename__ = "party_questionnaire"

    id = db.Column(db.Integer, primary_key=True)
    party_id = db.Column(
        db.Integer, db.ForeignKey("party.id"), nullable=False, index=True
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )

    budget = db.Column(db.String(20), nullable=True)
    meeting_type = db.Column(db.String(50), nullable=True)
    food_preferences = db.Column(db.JSON, nullable=True)
    dietary_restrictions = db.Column(db.JSON, nullable=True)
    atmosphere = db.Column(db.String(50), nullable=True)
    venue_types = db.Column(db.JSON, nullable=True)

    travel_weight = db.Column(db.Float, default=1.0, nullable=False)

    party = db.relationship("Party", backref=db.backref("questionnaires"))
    user = db.relationship("User", backref=db.backref("questionnaires"))

    __table_args__ = (
        db.UniqueConstraint("party_id", "user_id", name="unique_party_questionnaire"),
    )

    def __repr__(self):
        return f"<PartyQuestionnaire party={self.party_id} user={self.user_id}>"


class VenueVote(db.Model):
    __tablename__ = "venue_vote"

    id = db.Column(db.Integer, primary_key=True)
    party_id = db.Column(
        db.Integer, db.ForeignKey("party.id"), nullable=False, index=True
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )
    venue_place_id = db.Column(db.String(255), nullable=False, index=True)
    venue_name = db.Column(db.String(255), nullable=False)
    venue_address = db.Column(db.String(500), nullable=True)

    party = db.relationship("Party", backref=db.backref("votes"))
    user = db.relationship("User", backref=db.backref("venue_votes"))

    __table_args__ = (
        db.UniqueConstraint("party_id", "user_id", name="one_vote_per_user_per_party"),
    )

    def __repr__(self):
        return f"<VenueVote party={self.party_id} user={self.user_id} venue={self.venue_place_id}>"
