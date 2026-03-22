from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db

location_bp = Blueprint("location", __name__)


# saves the users current location so we can use it for midpoint calculations later
@location_bp.route("/api/location/save", methods=["POST"])
@login_required
def save_location():
    data = request.get_json()

    lat = data.get("lat")
    lon = data.get("lon")
    address = data.get("address")

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and longitude required"}), 400

    # make sure coords are valid
    try:
        lat = float(lat)
        lon = float(lon)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinate format"}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({"error": "Coordinates out of range"}), 400

    current_user.latitude = lat
    current_user.longitude = lon
    current_user.location_address = address

    db.session.commit()
    return jsonify({"message": "Location saved successfully"}), 200
