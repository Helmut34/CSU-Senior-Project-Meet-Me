from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.models import Party, PartyInvite, PartyQuestionnaire

questionare_bp = Blueprint("questionnaire", __name__)


# checks if a user belongs to a party (either as host or accepted invitee)
def check_party_access(party, user_id, require_accepted=True):
	if party.host_user_id == user_id:
		return True
	status_filter = {"status": "accepted"} if require_accepted else {}
	inv = PartyInvite.query.filter_by(
		party_id=party.id, invitee_user_id=user_id, **status_filter
	).first()
	return inv is not None


@questionare_bp.route("/api/parties/<int:party_id>/questionnaire", methods=["POST"])
@login_required
def submit_questionnaire(party_id):
	party = Party.query.get(party_id)
	if not party:
		return jsonify({"error": "Party not found"}), 404

	if not check_party_access(party, current_user.id):
		return jsonify(
			{"error": "Unauthorized - you are not a member of this party"}
		), 403

	data = request.get_json()
	if not data:
		return jsonify({"error": "Request body required"}), 400

	# validate the travel weight, has to be between 0.1 and 10
	tw = data.get("travel_weight", 1.0)
	try:
		tw = float(tw)
		if tw < 0.1 or tw > 10.0:
			return jsonify({"error": "Travel weight must be between 0.1 and 10.0"}), 400
	except (ValueError, TypeError):
		return jsonify({"error": "Travel weight must be a valid number"}), 400

	# see if they already submitted one, if so update it instead of making a new one
	existing = PartyQuestionnaire.query.filter_by(
		party_id=party_id, user_id=current_user.id
	).first()

	if existing:
		existing.budget = data.get("budget")
		existing.meeting_type = data.get("meeting_type")
		existing.food_preferences = data.get("food_preferences", [])
		existing.dietary_restrictions = data.get("dietary_restrictions", [])
		existing.atmosphere = data.get("atmosphere")
		existing.venue_types = data.get("venue_types", ["restaurant"])
		existing.travel_weight = tw
		msg = "Questionnaire updated successfully"
	else:
		new_q = PartyQuestionnaire(
			party_id=party_id,
			user_id=current_user.id,
			budget=data.get("budget"),
			meeting_type=data.get("meeting_type"),
			food_preferences=data.get("food_preferences", []),
			dietary_restrictions=data.get("dietary_restrictions", []),
			atmosphere=data.get("atmosphere"),
			venue_types=data.get("venue_types", ["restaurant"]),
			travel_weight=tw,
		)
		db.session.add(new_q)
		msg = "Questionnaire submitted successfully"

	# sync the travel weight to the party/invite weight so midpoint calc picks it up
	if party.host_user_id == current_user.id:
		party.host_midpoint_weight = tw
	else:
		inv = PartyInvite.query.filter_by(
			party_id=party_id, invitee_user_id=current_user.id
		).first()
		if inv:
			inv.midpoint_weight = tw

	db.session.commit()

	return jsonify({"message": msg, "travel_weight": tw}), 200


@questionare_bp.route("/api/parties/<int:party_id>/questionnaire", methods=["GET"])
@login_required
def get_questionnaire(party_id):
	party = Party.query.get(party_id)
	if not party:
		return jsonify({"error": "Party not found"}), 404

	# let them view even if invite is still pending so they can fill it out
	if not check_party_access(party, current_user.id, require_accepted=False):
		return jsonify({"error": "Unauthorized"}), 403

	q = PartyQuestionnaire.query.filter_by(
		party_id=party_id, user_id=current_user.id
	).first()

	if not q:
		return jsonify({"questionnaire": None}), 200

	return jsonify(
		{
			"budget": q.budget,
			"meeting_type": q.meeting_type,
			"food_preferences": q.food_preferences,
			"dietary_restrictions": q.dietary_restrictions,
			"atmosphere": q.atmosphere,
			"venue_types": q.venue_types,
			"travel_weight": q.travel_weight,
		}
	), 200


@questionare_bp.route("/api/parties/<int:party_id>/questionnaires/all", methods=["GET"])
@login_required
def get_all_questionnaires(party_id):
	party = Party.query.get(party_id)
	if not party:
		return jsonify({"error": "Party not found"}), 404

	if not check_party_access(party, current_user.id):
		return jsonify({"error": "Not authorized to view this"}), 403

	all_q = PartyQuestionnaire.query.filter_by(party_id=party_id).all()

	results = []
	for q in all_q:
		results.append(
			{
				"user_id": q.user_id,
				"budget": q.budget,
				"meeting_type": q.meeting_type,
				"food_preferences": q.food_preferences,
				"dietary_restrictions": q.dietary_restrictions,
				"atmosphere": q.atmosphere,
				"venue_types": q.venue_types,
				"travel_weight": q.travel_weight,
			}
		)

	return jsonify(results), 200


@questionare_bp.route("/api/parties/<int:party_id>/matched-venues", methods=["GET"])
@login_required
def get_matched_venues(party_id):
	party = Party.query.get(party_id)
	if not party:
		return jsonify({"error": "Party not found"}), 404

	if not check_party_access(party, current_user.id):
		return jsonify({"error": "Not authorized"}), 403

	all_q = PartyQuestionnaire.query.filter_by(party_id=party_id).all()

	if len(all_q) < 2:
		return jsonify({"error": "Not enough questionnaires submitted"}), 400

	if not party.midpoint_latitude or not party.midpoint_longitude:
		return jsonify({"error": "Midpoint not calculated yet"}), 400

	prefs = combine_preferences(all_q)

	# build the search params for the venues endpoint
	v_type = prefs["venue_types"][0] if prefs["venue_types"] else "restaurant"
	kw = ", ".join(prefs["food_preferences"]) if prefs["food_preferences"] else None

	search_params = {
		"latitude": party.midpoint_latitude,
		"longitude": party.midpoint_longitude,
		"radius": 5000,
		"type": v_type,
		"budget": prefs["budget"],
	}
	if kw:
		search_params["keyword"] = kw

	return jsonify(
		{
			"midpoint": {
				"lat": party.midpoint_latitude,
				"lon": party.midpoint_longitude,
			},
			"combined_preferences": prefs,
			"search_params": search_params,
		}
	), 200


# merges everyones preferences into one set of search params budget goes with
# the lowest ,food prefs and venue types go with what  most people picked
def combine_preferences(questionnaires):
	budgets = []
	meeting_types = []
	all_foods = []
	atmospheres = []
	all_venues = []

	for q in questionnaires:
		if q.budget:
			budgets.append(q.budget)
		if q.meeting_type:
			meeting_types.append(q.meeting_type)
		if q.food_preferences:
			all_foods.extend(q.food_preferences)
		if q.atmosphere:
			atmospheres.append(q.atmosphere)
		if q.venue_types:
			all_venues.extend(q.venue_types)

	# buget picker
	budget_order = {"low": 1, "medium": 2, "high": 3, "any": 4}
	budget = min(budgets, key=lambda b: budget_order.get(b, 4)) if budgets else None

	# prioritize stuff everyone picked, otherwise sort by popularity
	food_counts = {}
	for f in all_foods:
		food_counts[f] = food_counts.get(f, 0) + 1
	num_respondents = sum(1 for q in questionnaires if q.food_preferences)
	unanimous_foods = [
		f
		for f, cnt in food_counts.items()
		if num_respondents > 0 and cnt >= num_respondents
	]
	food_prefs = (
		unanimous_foods
		if unanimous_foods
		else sorted(food_counts.keys(), key=lambda f: food_counts[f], reverse=True)
	)

	# same thing for venues
	venue_counts = {}
	for vt in all_venues:
		venue_counts[vt] = venue_counts.get(vt, 0) + 1
	venue_respondents = sum(1 for q in questionnaires if q.venue_types)
	unanimous_venues = [
		vt
		for vt, cnt in venue_counts.items()
		if venue_respondents > 0 and cnt >= venue_respondents
	]
	venue_types = (
		unanimous_venues
		if unanimous_venues
		else (
			sorted(venue_counts.keys(), key=lambda v: venue_counts[v], reverse=True)
			if venue_counts
			else ["restaurant"]
		)
	)

	return {
		"budget": budget,
		"meeting_types": list(set(meeting_types)),
		"food_preferences": food_prefs,
		"atmospheres": list(set(atmospheres)),
		"venue_types": venue_types,
	}
