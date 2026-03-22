from flask import Blueprint, request, jsonify
from flask_login import login_required
from flask import current_app
from app import limiter, cache
import googlemaps
import os

venues_bp = Blueprint("venues", __name__, url_prefix="/api/venues")


# searches google places near a location
@venues_bp.route("/search", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def search_venues():
    data = request.get_json()

    if not data or not data.get("latitude") or not data.get("longitude"):
        return jsonify({"error": "Latitude and longitude required"}), 400

    lat = data.get("latitude")
    lng = data.get("longitude")
    radius = data.get("radius", 2000)
    venue_type = data.get("type", "restaurant")
    keyword = data.get("keyword")
    budget = data.get("budget")

    try:
        lat = float(lat)
        lng = float(lng)
        radius = int(radius)

        if not (-90 <= lat <= 90):
            return jsonify({"error": "Invalid latitude"}), 400
        if not (-180 <= lng <= 180):
            return jsonify({"error": "Invalid longitude"}), 400
        if radius < 100 or radius > 50000:
            return jsonify(
                {"error": "Radius must be between 100 and 50000 meters"}
            ), 400

    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinate or radius format"}), 400

    cache_key = f"venues:{lat}:{lng}:{radius}:{venue_type}"
    cached = cache.get(cache_key)
    if cached:
        return jsonify(cached), 200

    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return jsonify({"error": "Venue search service not configured"}), 500

    try:
        gmaps = googlemaps.Client(key=api_key)

        # map budget labels to google price levels (0-4 scale)
        price_levels = {"low": (0, 1), "medium": (1, 2), "high": (2, 4), "any": (0, 4)}

        params = {
            "location": (lat, lng),
            "radius": radius,
            "type": venue_type,
            "open_now": False,
        }

        if keyword:
            params["keyword"] = keyword

        if budget and budget in price_levels:
            lo, hi = price_levels[budget]
            params["min_price"] = lo
            params["max_price"] = hi

        places_result = gmaps.places_nearby(**params)

        if not places_result or "results" not in places_result:
            return jsonify({"venues": []}), 200

        # only return top 10 results
        venues = []
        for place in places_result["results"][:10]:
            venues.append(
                {
                    "place_id": place.get("place_id"),
                    "name": place.get("name"),
                    "address": place.get("vicinity", "Address not available"),
                    "rating": place.get("rating"),
                    "user_ratings_total": place.get("user_ratings_total"),
                    "types": place.get("types", []),
                    "latitude": place["geometry"]["location"]["lat"],
                    "longitude": place["geometry"]["location"]["lng"],
                    "open_now": place.get("opening_hours", {}).get("open_now"),
                    "price_level": place.get("price_level"),
                }
            )

        current_app.logger.info(f"Found {len(venues)} venues near ({lat}, {lng})")

        result = {"venues": venues, "search_location": {"latitude": lat, "longitude": lng}}
        cache.set(f"venues:{lat}:{lng}:{radius}:{venue_type}", result, timeout=900)

        return jsonify(result), 200

    except googlemaps.exceptions.ApiError as e:
        current_app.logger.error(f"Google Places API error: {str(e)}")
        return jsonify({"error": "Failed to search venues"}), 500
    except Exception as e:
        current_app.logger.error(f"Venue search failed: {str(e)}")
        return jsonify({"error": "Venue search failed"}), 500
