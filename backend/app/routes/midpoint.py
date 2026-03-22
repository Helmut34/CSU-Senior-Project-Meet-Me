from flask import Blueprint
import math

midpoint_bp = Blueprint("midpoint", __name__)


def calculate_midpoint(coordinates, weights=None):
    # source: https://math.stackexchange.com/questions/4409394/how-to-calculate-the-middlle-coordinate-point-on-earth-between-two-coordinates

    count = len(coordinates)

    # if no weights given default to 1
    if weights is None:
        weights = [1.0] * count

    total_weight = sum(weights)
    normalized = [w / total_weight for w in weights]

    x = y = z = 0.0

    for coord, w in zip(coordinates, normalized):
        lat_rad = math.radians(coord["lat"])
        lon_rad = math.radians(coord["lon"])

        # project onto unit sphere
        x += w * math.cos(lat_rad) * math.cos(lon_rad)
        y += w * math.cos(lat_rad) * math.sin(lon_rad)
        z += w * math.sin(lat_rad)

    # convert back from cartesian to lat/lon
    lon = math.atan2(y, x)
    hyp = math.sqrt(x * x + y * y)
    lat = math.atan2(z, hyp)

    return {"lat": math.degrees(lat), "lon": math.degrees(lon), "num_locations": count}
