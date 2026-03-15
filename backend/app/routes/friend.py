from flask import Blueprint, request, jsonify
from flask_security import auth_required, current_user
from app import db
from app.models.models import User, Friends, FriendStatus

friend_bp = Blueprint('friend', __name__, url_prefix='/api/friends')

@friend_bp.route('/add', methods=['POST'])
@auth_required()
def add_friend():
	data = request.get_json()
	friend_email = data.get('friend_email')

	if not friend_email:
		return jsonify({"error": "Friend email is required"}), 400

	friend_user = User.query.filter_by(email=friend_email).first()
	if not friend_user:
		return jsonify({"error": "User not found"}), 404

	# cant add yourself
	if friend_user.id == current_user.id:
		return jsonify({"error": "Cannot add yourself as a friend"}), 400

	# check both directions since either person could have sent the request
	existing = Friends.query.filter(
		((Friends.user_id == current_user.id) & (Friends.friend_id == friend_user.id)) |
		((Friends.user_id == friend_user.id) & (Friends.friend_id == current_user.id))
	).first()

	if existing:
		return jsonify({"error": "Already Requested"}), 400

	friend_req = Friends(user_id=current_user.id, friend_id=friend_user.id, status=FriendStatus.pending)
	db.session.add(friend_req)
	db.session.commit()

	return jsonify({"message": "Friend request sent"})

@friend_bp.route('/accept', methods=['POST'])
@auth_required()
def accept_friend():
	data = request.get_json()
	req_id = data.get('request_id')

	if not req_id:
		return jsonify({'error': 'Cannot Process Request'}), 400

	# only the person who RECEIVED the request can accept it
	friend_req = Friends.query.filter_by(id=req_id, friend_id=current_user.id).first()

	if not friend_req:
		return jsonify({'error': 'Friend request not found'}), 404

	friend_req.status = FriendStatus.accepted
	db.session.commit()

	return jsonify({'message': 'Friend request accepted'}), 200

@friend_bp.route('/decline', methods=['POST'])
@auth_required()
def decline_friend():
	data = request.get_json()
	req_id = data.get('request_id')

	if not req_id:
		return jsonify({'error': 'Cannot Process Request'}), 400

	friend_req = Friends.query.filter_by(id=req_id, friend_id=current_user.id).first()

	if not friend_req:
		return jsonify({'error': 'Friend request not found'}), 404

	friend_req.status = FriendStatus.declined
	db.session.commit()

	return jsonify({'message': 'Friend request declined'}), 200


@friend_bp.route('/', methods=['GET'])
@auth_required()
def get_friends():
	# get all accepted friendships where the current user is on either side
	accepted = Friends.query.filter(
		((Friends.user_id == current_user.id) | (Friends.friend_id == current_user.id)) &
		(Friends.status == FriendStatus.accepted)
	).all()

	friends_list = []
	for fr in accepted:
		# figure out which side is the "other" person
		other = fr.friend if fr.user_id == current_user.id else fr.user
		friends_list.append({
			'id': other.id,
			'email': other.email,
			'username': other.username
		})

	return jsonify(friends_list), 200

@friend_bp.route('/requests', methods=['GET'])
@auth_required()
def get_pending_requests():
	pending = Friends.query.filter_by(friend_id=current_user.id, status=FriendStatus.pending).all()

	result = []
	for fr in pending:
		result.append({
			'id': fr.id,
			'user': {
				'id': fr.user.id,
				'email': fr.user.email,
				'username': fr.user.username
			}
		})

	return jsonify(result), 200
