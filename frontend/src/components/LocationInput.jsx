/*source https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition*/

import React, { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { locationAPI } from "./services/api";

const LocationInput = ({ onLocationFound }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGPS = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const locationData = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          address: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        };
        setResult(locationData);
        setLoading(false);

        try {
          setSaving(true);
          await locationAPI.saveLocation(
            locationData.lat,
            locationData.lon,
            locationData.address,
          );
          if (onLocationFound) onLocationFound(locationData);
        } catch (err) {
          console.error("Failed to save location:", err);
          setError("Please try again.");
        } finally {
          setSaving(false);
        }
      },
      () => {
        setError("GPS access denied.enable location services.");
        setLoading(false);
      },
    );
  };

  return (
    <div className="location-input">
      <button
        type="button"
        onClick={handleGPS}
        disabled={loading || saving}
        className="btn-location"
      >
        <MapPin size={20} />
        {loading
          ? "Getting Location..."
          : saving
            ? "Saving..."
            : "Find My Location"}
      </button>

      {error && <p>{error}</p>}

      {result && (
        <div>
          <Check size={20} />
          <strong>Location Found!</strong>
        </div>
      )}
    </div>
  );
};

export default LocationInput;
