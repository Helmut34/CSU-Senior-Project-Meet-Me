from flask import Blueprint, request, jsonify
from flask_security import auth_required, current_user, hash_password
from flask_security.utils import login_user, logout_user
from flask import current_app
from app import db, limiter
from app.models.models import User
from app.utils.validation import validate_email, validate_username, validate_password
import uuid

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
	data = request.get_json()

	if not data.get('email') or not data.get('password'):
		return jsonify({"error": "Email and password are required"}), 400

	if not data.get('username'):
		return jsonify({"error": "Username is required"}), 400

	# strip whitespace and lowercase the email so we dont get duplicates
	email = data.get('email').strip().lower()
	username = data.get('username').strip()
	password = data.get('password')

	if not validate_email(email):
		return jsonify({"error": "Invalid email"}), 400

	if not validate_username(username):
		return jsonify({"error": "Username must be greater than 3 characters, no special characters "}), 400

	if not validate_password(password):
		return jsonify({"error": "Password must be at least 8 characters"}), 400

	# check if email or username already taken
	existing_email = User.query.filter_by(email=email).first()
	if existing_email:
		return jsonify({"error": "Email already registered"}), 400

	existing_user = User.query.filter_by(username=username).first()
	if existing_user:
		return jsonify({"error": "Username already taken"}), 400


	try:
		new_user = User(
			email=email,
			username=username,
			password=hash_password(password),
			fs_uniquifier=str(uuid.uuid4())
		)

		db.session.add(new_user)
		db.session.commit()

		# log them in right after registering so they dont have to login again
		login_user(new_user)

		current_app.logger.info(f"NEW USER: {email} (ID: {new_user.id})")

		return jsonify({
			"message": "User registered successfully",
			"user": {"id": new_user.id, "email": new_user.email, "username": new_user.username}
		}), 201

	except Exception as e:
		db.session.rollback()
		current_app.logger.error(f"Error REGISTERING USER:{email}, {str(e)}")
		return jsonify({"error": "Registration failed"}), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
	data = request.get_json()

	if not data.get('email') or not data.get('password'):
		return jsonify({"error": "Email and password are required"}), 400

	email = data.get('email').strip().lower()
	password = data.get('password')

	if not validate_email(email):
		return jsonify({"error": "Invalid email or password"}), 400

	found_user = User.query.filter_by(email=email).first()

	# dont tell them which field was wrong for security
	if not found_user or not found_user.verify_and_update_password(password):
		return jsonify({"error": "Invalid email or password"}), 401

	login_user(found_user)
	current_app.logger.info(f"USER LOGGED IN: {email} (ID: {found_user.id})")
	return jsonify({
		"message": "User logged in successfully",
		"user": {"id": found_user.id, "email": found_user.email, "username": found_user.username}
	}), 200

@auth_bp.route('/logout', methods=['POST'])
@auth_required()
def logout():
	logout_user()
	return jsonify({"message": "Logout Successful"}), 200


@auth_bp.route('/me', methods=['GET'])
@auth_required()
def get_current_user():
	return jsonify({
		"user": {"id": current_user.id, "email": current_user.email, "username": current_user.username}
	}), 200
