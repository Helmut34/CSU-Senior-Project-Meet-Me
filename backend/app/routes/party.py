from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.models import Party, PartyInvite, PartyQuestionnaire, VenueVote
from app.models.queryHandler import (
    get_pending_party_invites,
    get_party_with_members,
    get_active_party_for_user,
    get_questionnaires_by_user,
    verify_friendships,
)
from app.routes.midpoint import calculate_midpoint
from urllib.parse import urlencode
from datetime import datetime, timedelta
import random


party_bp = Blueprint("party", __name__)


# helper to check if a user is part of a party (host or accepted invite)
def is_party_member(party, user_id):
    if party.host_user_id == user_id:
        return True
    invite = PartyInvite.query.filter_by(
        party_id=party.id, invitee_user_id=user_id, status="accepted"
    ).first()
    return invite is not None


@party_bp.route("/api/party/create", methods=["POST"])
@login_required
def create_party():
    data = request.get_json()
    friends_ids = data.get("friends_ids", [])

    # verify all selected users are friends in one query instead of N
    confirmed = verify_friendships(current_user.id, friends_ids)
    for fid in friends_ids:
        if fid not in confirmed:
            return jsonify({"error": "No Longer Friends"}), 400

    party = Party(host_user_id=current_user.id)
    db.session.add(party)
    db.session.flush()  # need the party.id before creating invites

    for fid in friends_ids:
        inv = PartyInvite(party_id=party.id, invitee_user_id=fid)
        db.session.add(inv)

    db.session.commit()

    return jsonify({"message": "Party created successfully", "party_id": party.id}), 201


@party_bp.route("/api/parties/invites", methods=["GET"])
@login_required
def get_pending_invites():
    invites = get_pending_party_invites(current_user.id)

    result = []
    for inv in invites:
        p = inv.party
        host_user = p.host

        invitee_list = []
        for i in p.invites:
            u = i.invitee
            invitee_list.append(
                {
                    "id": u.id,
                    "email": u.email,
                    "username": u.username,
                    "status": i.status.value
                    if hasattr(i.status, "value")
                    else str(i.status),
                }
            )

        result.append(
            {
                "id": inv.id,
                "party_id": p.id,
                "host": {
                    "id": host_user.id,
                    "email": host_user.email,
                    "username": host_user.username,
                },
                "invitees": invitee_list,
            }
        )

    return jsonify(result), 200


@party_bp.route("/api/parties/invites/<int:invite_id>/accept", methods=["POST"])
@login_required
def accept_invite(invite_id):
    invite = PartyInvite.query.get(invite_id)

    if not invite:
        return jsonify({"error": "Invite not found"}), 404
    if invite.invitee_user_id != current_user.id:
        return jsonify({"error": "Not your invite"}), 403

    invite.status = "accepted"
    db.session.commit()

    return jsonify({"message": "Invite accepted"}), 200


@party_bp.route("/api/parties/invites/<int:invite_id>/reject", methods=["POST"])
@login_required
def reject_invite(invite_id):
    invite = PartyInvite.query.get(invite_id)

    if not invite:
        return jsonify({"error": "Invite not found"}), 404
    if invite.invitee_user_id != current_user.id:
        return jsonify({"error": "Not your invite"}), 403

    invite.status = "declined"
    db.session.commit()

    return jsonify({"message": "Invite declined"}), 200


@party_bp.route("/api/parties/<int:party_id>", methods=["GET"])
@login_required
def get_party(party_id):
    party = get_party_with_members(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    if not is_party_member(party, current_user.id):
        return jsonify({"error": "Not authorized"}), 403

    invite_data = []
    for inv in party.invites:
        user = inv.invitee
        invite_data.append(
            {
                "id": inv.id,
                "invitee": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                },
                "status": inv.status.value
                if hasattr(inv.status, "value")
                else str(inv.status),
            }
        )

    host = party.host

    cal_url = None
    if party.selected_venue_name and party.meeting_date:
        cal_url = build_gcal_link(
            f"Meetup at {party.selected_venue_name}",
            party.selected_venue_address,
            party.meeting_date.isoformat(),
        )

    return jsonify(
        {
            "party_id": party.id,
            "host": {"id": host.id, "email": host.email, "username": host.username},
            "invitees": invite_data,
            "midpoint_latitude": party.midpoint_latitude,
            "midpoint_longitude": party.midpoint_longitude,
            "selected_venue_name": party.selected_venue_name,
            "selected_venue_address": party.selected_venue_address,
            "meeting_date": party.meeting_date.isoformat()
            if party.meeting_date
            else None,
            "calendar_url": cal_url,
        }
    ), 200


@party_bp.route("/api/parties/active", methods=["GET"])
@login_required
def get_active_party():
    active_party = get_active_party_for_user(current_user.id)

    if not active_party:
        return jsonify({"error": "No active party"}), 404

    host = active_party.host

    members = []
    for inv in active_party.invites:
        u = inv.invitee
        members.append(
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "status": inv.status.value
                if hasattr(inv.status, "value")
                else str(inv.status),
            }
        )

    return jsonify(
        {
            "party_id": active_party.id,
            "host": {"id": host.id, "email": host.email, "username": host.username},
            "invitees": members,
            "midpoint_latitude": active_party.midpoint_latitude,
            "midpoint_longitude": active_party.midpoint_longitude,
        }
    ), 200


@party_bp.route("/api/parties/leave", methods=["POST"])
@login_required
def leave_party():
    data = request.get_json()
    party_id = data.get("party_id")

    party = Party.query.get(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    # if the host leaves delete everything related to the party
    if party.host_user_id == current_user.id:
        VenueVote.query.filter_by(party_id=party_id).delete()
        PartyQuestionnaire.query.filter_by(party_id=party_id).delete()
        PartyInvite.query.filter_by(party_id=party_id).delete()
        db.session.delete(party)
        db.session.commit()
        return jsonify({"message": "Party Destroyed!!!"}), 200

    # otherwise just remove the invite
    invite = PartyInvite.query.filter_by(
        party_id=party_id, invitee_user_id=current_user.id
    ).first()

    if not invite:
        return jsonify({"error": " not part of this party"}), 404

    db.session.delete(invite)
    db.session.commit()

    return jsonify({"message": "Left party successfully"}), 200


@party_bp.route("/api/parties/<int:party_id>/midpoint", methods=["GET"])
@login_required
def get_party_midpoint(party_id):
    party = get_party_with_members(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    if not is_party_member(party, current_user.id):
        return jsonify({"error": "Not authorized"}), 403

    # one query for all questionnaires instead of one per person
    questionnaires = get_questionnaires_by_user(party_id)

    locations = []
    weights = []
    missing_locations = []

    # add host location
    host = party.host
    if host.latitude and host.longitude:
        locations.append(
            {
                "lat": host.latitude,
                "lon": host.longitude,
                "user": host.username or host.email,
            }
        )
        host_q = questionnaires.get(host.id)
        weights.append(host_q.travel_weight if host_q else party.host_midpoint_weight)
    else:
        missing_locations.append(host.username or host.email)

    # add accepted invitee locations
    for inv in party.invites:
        if (
            inv.status != "accepted"
            and getattr(inv.status, "value", None) != "accepted"
        ):
            continue

        user = inv.invitee
        if user.latitude and user.longitude:
            locations.append(
                {
                    "lat": user.latitude,
                    "lon": user.longitude,
                    "user": user.username or user.email,
                }
            )
            user_q = questionnaires.get(user.id)
            weights.append(user_q.travel_weight if user_q else inv.midpoint_weight)
        else:
            missing_locations.append(user.username or user.email)

    # need at least 2 locations to find a midpoint
    if len(locations) < 2:
        return jsonify(
            {
                "error": "Not enough locations to calculate midpoint",
                "locations_count": len(locations),
                "members_without_location": missing_locations,
            }
        ), 400

    midpoint = calculate_midpoint(locations, weights)

    # save the midpoint to the party so we can use it for venue search
    party.midpoint_latitude = midpoint["lat"]
    party.midpoint_longitude = midpoint["lon"]
    db.session.commit()

    return jsonify(
        {
            "message": "Midpoint calculated",
            "midpoint": {"lat": midpoint["lat"], "lon": midpoint["lon"]},
            "num_locations": midpoint["num_locations"],
            "members": [loc["user"] for loc in locations],
            "members_without_location": missing_locations,
        }
    ), 200


@party_bp.route("/api/parties/<int:party_id>/weight", methods=["PUT"])
@login_required
def update_party_weight(party_id):
    party = Party.query.get(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    data = request.get_json()
    if not data or "weight" not in data:
        return jsonify({"error": "Weight required"}), 400

    try:
        new_weight = float(data["weight"])
        if new_weight < 0:
            return jsonify({"error": "Weight must be non-negative"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Weight must be a valid number"}), 400

    # update the weight depending on if theyre the host or an invitee
    if party.host_user_id == current_user.id:
        party.host_midpoint_weight = new_weight
        db.session.commit()
        return jsonify(
            {"message": "Host weight updated successfully", "weight": new_weight}
        ), 200

    invite = PartyInvite.query.filter_by(
        party_id=party_id, invitee_user_id=current_user.id, status="accepted"
    ).first()

    if invite:
        invite.midpoint_weight = new_weight
        db.session.commit()
        return jsonify(
            {"message": "Invitee weight updated successfully", "weight": new_weight}
        ), 200

    return jsonify({"error": "Not authorized"}), 403


@party_bp.route("/api/parties/<int:party_id>/weight", methods=["GET"])
@login_required
def get_party_weight(party_id):
    party = Party.query.get(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    if party.host_user_id == current_user.id:
        return jsonify({"weight": party.host_midpoint_weight, "role": "host"}), 200

    invite = PartyInvite.query.filter_by(
        party_id=party_id, invitee_user_id=current_user.id
    ).first()
    if invite:
        return jsonify(
            {
                "weight": invite.midpoint_weight,
                "role": "invitee",
                "status": invite.status.value
                if hasattr(invite.status, "value")
                else str(invite.status),
            }
        ), 200

    return jsonify({"error": "Not authorized"}), 403


@party_bp.route("/api/parties/<int:party_id>/vote", methods=["POST"])
@login_required
def vote_for_venue(party_id):
    party = Party.query.get(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    if not is_party_member(party, current_user.id):
        return jsonify({"error": "You are not in this party"}), 403

    data = request.get_json()
    if not data or not data.get("venue_place_id") or not data.get("venue_name"):
        return jsonify({"error": "venue_place_id and venue_name required"}), 400

    # note; remove make frontend only, did not implement fucntionality
    existing_vote = VenueVote.query.filter_by(
        party_id=party_id, user_id=current_user.id
    ).first()
    if existing_vote:
        existing_vote.venue_place_id = data["venue_place_id"]
        existing_vote.venue_name = data["venue_name"]
        existing_vote.venue_address = data.get("venue_address", "")
    else:
        new_vote = VenueVote(
            party_id=party_id,
            user_id=current_user.id,
            venue_place_id=data["venue_place_id"],
            venue_name=data["venue_name"],
            venue_address=data.get("venue_address", ""),
        )
        db.session.add(new_vote)

    db.session.commit()
    return jsonify(
        {"message": "Vote recorded", "venue_place_id": data["venue_place_id"]}
    ), 200


@party_bp.route("/api/parties/<int:party_id>/votes", methods=["GET"])
@login_required
def get_votes(party_id):
    party = Party.query.get(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    # only party members can see votes
    if not is_party_member(party, current_user.id):
        return jsonify({"error": "Not authorized"}), 403

    all_votes = VenueVote.query.filter_by(party_id=party_id).all()

    # tally up the votes by venue
    tally = {}
    for v in all_votes:
        pid = v.venue_place_id
        if pid not in tally:
            tally[pid] = {
                "venue_place_id": pid,
                "venue_name": v.venue_name,
                "venue_address": v.venue_address,
                "count": 0,
            }
        tally[pid]["count"] += 1

    my_vote = VenueVote.query.filter_by(
        party_id=party_id, user_id=current_user.id
    ).first()

    return jsonify(
        {
            "votes": sorted(tally.values(), key=lambda x: x["count"], reverse=True),
            "my_vote": my_vote.venue_place_id if my_vote else None,
            "total_voters": len(all_votes),
        }
    ), 200


@party_bp.route("/api/parties/<int:party_id>/finalize", methods=["POST"])
@login_required
def finalize_venue(party_id):
    party = Party.query.get(party_id)
    if not party:
        return jsonify({"error": "Party not found"}), 404

    # only host can lock in the venue
    if party.host_user_id != current_user.id:
        return jsonify({"error": "Only the host can finalize"}), 403

    all_votes = VenueVote.query.filter_by(party_id=party_id).all()
    if not all_votes:
        return jsonify({"error": "No votes cast yet"}), 400

    # count up votes and pick the winner (random tiebreak if needed)
    tally = {}
    for v in all_votes:
        pid = v.venue_place_id
        if pid not in tally:
            tally[pid] = {"name": v.venue_name, "address": v.venue_address, "count": 0}
        tally[pid]["count"] += 1

    top_count = max(t["count"] for t in tally.values())
    tied = [pid for pid, t in tally.items() if t["count"] == top_count]
    winner_id = random.choice(tied)
    winner = tally[winner_id]

    party.selected_venue_name = winner["name"]
    party.selected_venue_address = winner["address"]

    # optionally set a meeting date and generate a google calendar link
    data = request.get_json() or {}
    date_str = data.get("meeting_date")
    cal_url = None

    if date_str:
        party.meeting_date = datetime.fromisoformat(date_str)
        cal_url = build_gcal_link(
            title=f"Meet Me in the Middle - {winner['name']}",
            location=winner["address"] or "",
            date_str=date_str,
        )

    db.session.commit()

    return jsonify(
        {
            "message": "Venue finalized",
            "selected_venue_name": party.selected_venue_name,
            "selected_venue_address": party.selected_venue_address,
            "meeting_date": party.meeting_date.isoformat()
            if party.meeting_date
            else None,
            "calendar_url": cal_url,
        }
    ), 200


def build_gcal_link(title, location, date_str, duration_hours=2):
    dt = datetime.fromisoformat(date_str)
    start = dt.strftime("%Y%m%dT%H%M%S")
    end = (dt + timedelta(hours=duration_hours)).strftime("%Y%m%dT%H%M%S")
    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": f"{start}/{end}",
        "location": location or "",
        "details": "Meet Me in the Middle - group meetup!",
    }
    return f"https://calendar.google.com/calendar/render?{urlencode(params)}"
