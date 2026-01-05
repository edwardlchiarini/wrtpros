// Leaflet map: Dallas + approx 1-hour radius (visual) using a circle.
// Note: true drive-time isochrones require a routing API (Mapbox/ORS).

(function() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  const dallas = [32.7767, -96.7970]; // Dallas, TX (approx)
  const map = L.map("map", { scrollWheelZoom: false }).setView(dallas, 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const hq = L.marker([32.9186, -96.7498]).addTo(map); // ~8312 Coral Dr area
  hq.bindPopup("<b>WRTPros HQ</b><br>8312 Coral Dr, Dallas, TX 75243<br><a href='tel:+14697599659'>Call/Text 24/7</a>");

  // Approximate 1 hour travel time radius (60 miles / 96.5 km) – adjust if you prefer.
  const radiusMeters = 96500;

  const circle = L.circle(dallas, {
    radius: radiusMeters,
    color: "#4dd3ff",
    weight: 2,
    fillColor: "#4dd3ff",
    fillOpacity: 0.08
  }).addTo(map);

  circle.bindPopup("<b>Typical Service Area</b><br>Approx. 1-hour radius from Dallas.<br>Extended areas available (additional travel rates may apply).");

  // Fit bounds to circle and HQ
  const group = L.featureGroup([circle, hq]);
  map.fitBounds(group.getBounds().pad(0.15));
})();