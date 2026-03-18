/*https://leafletjs.com/examples/quick-start/ */
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const LocationMap = ({ userLocation }) => {
  if (!userLocation || !userLocation.lat || !userLocation.lon) {
    return (
      <div className="map-placeholder">
        <p>No location set. Please find your location first.</p>
      </div>
    );
  }

  const position = [userLocation.lat, userLocation.lon];

  return (
    <div className="location-map-container">
      <MapContainer
        center={position}
        zoom={13}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "12px",
          zIndex: 1,
        }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <strong>Your Location</strong>
            <br />
            {userLocation.address ||
              `${userLocation.lat.toFixed(6)}, ${userLocation.lon.toFixed(6)}`}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationMap;
