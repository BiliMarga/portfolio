/* ==========================================================================
   DRONE MISSION SIMULATOR & GROUND STATION HUD
   Autonomous GPS Waypoint Flight Controller Emulation
   Author: Bilisuma Jabesa Merga Portfolio
   ========================================================================== */

(function () {
  'use strict';

  // Mission Flight Waypoints extracted from OSMNx Python Route Planner
  const WAYPOINTS = [
    { lat: 9.0671569, lon: 38.5880855, alt: 24.5 },
    { lat: 9.0676117, lon: 38.5886436, alt: 25.0 },
    { lat: 9.0679733, lon: 38.5884029, alt: 25.2 },
    { lat: 9.0685598, lon: 38.5889637, alt: 25.8 },
    { lat: 9.0689156, lon: 38.5892718, alt: 26.0 },
    { lat: 9.0692864, lon: 38.5890430, alt: 26.2 },
    { lat: 9.0697401, lon: 38.5886372, alt: 26.5 },
    { lat: 9.0695982, lon: 38.5885076, alt: 26.3 },
    { lat: 9.0690510, lon: 38.5880037, alt: 26.0 },
    { lat: 9.0625364, lon: 38.5781041, alt: 25.5 },
    { lat: 9.0624354, lon: 38.5778016, alt: 25.3 },
    { lat: 9.0622483, lon: 38.5774039, alt: 25.0 },
    { lat: 9.0612601, lon: 38.5759581, alt: 24.8 },
    { lat: 9.0583532, lon: 38.5734403, alt: 24.2 },
    { lat: 9.0580874, lon: 38.5732780, alt: 24.0 },
    { lat: 9.0569038, lon: 38.5724751, alt: 23.8 },
    { lat: 9.0566763, lon: 38.5721077, alt: 23.5 },
    { lat: 9.0566018, lon: 38.5712326, alt: 23.2 },
    { lat: 9.0567383, lon: 38.5701583, alt: 23.0 },
    { lat: 9.0565966, lon: 38.5697186, alt: 22.8 },
    { lat: 9.0565839, lon: 38.5696957, alt: 22.6 },
    { lat: 9.0552046, lon: 38.5681531, alt: 22.2 },
    { lat: 9.0548291, lon: 38.5676317, alt: 22.0 },
    { lat: 9.0544463, lon: 38.5670559, alt: 21.8 },
    { lat: 9.0540866, lon: 38.5665356, alt: 21.5 }
  ];

  let map = null;
  let droneMarker = null;
  let pathPolyline = null;
  let flownPolyline = null;
  let obstacleMarker = null;

  // Simulator State
  let simRunning = false;
  let isRTH = false;
  let obstacleInjected = false;
  let currentWpIndex = 0;
  let progressInLeg = 0; // 0 to 1 between WP[i] and WP[i+1]
  let animFrameId = null;
  let battery = 98.4;
  let lastTime = 0;

  // DOM Elements
  const elFsmState = document.getElementById('telem-fsm-state');
  const elWp = document.getElementById('telem-wp');
  const elLat = document.getElementById('telem-lat');
  const elLon = document.getElementById('telem-lon');
  const elDist = document.getElementById('telem-dist');
  const elHeading = document.getElementById('telem-heading');
  const elPitch = document.getElementById('telem-pitch');
  const elRoll = document.getElementById('telem-roll');
  const elSpeed = document.getElementById('telem-speed');
  const elBattery = document.getElementById('telem-battery');
  const elConsole = document.getElementById('drone-console');

  const btnStart = document.getElementById('btn-sim-start');
  const btnObstacle = document.getElementById('btn-sim-obstacle');
  const btnRth = document.getElementById('btn-sim-rth');
  const btnReset = document.getElementById('btn-sim-reset');

  // Haversine Distance Formula (matches TinyGPS++ math)
  function haversineDistMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of Earth in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Bearing Formula
  function calculateBearing(lat1, lon1, lat2, lon2) {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaL = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(deltaL) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaL);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  function logMessage(msg, type = 'info') {
    if (!elConsole) return;
    const p = document.createElement('p');
    const time = new Date().toTimeString().split(' ')[0];
    p.textContent = `[${time}] ${msg}`;
    if (type === 'warn') p.style.color = '#f59e0b';
    if (type === 'error') p.style.color = '#f43f5e';
    if (type === 'success') p.style.color = '#10b981';
    elConsole.appendChild(p);
    elConsole.scrollTop = elConsole.scrollHeight;
  }

  // Initialize Leaflet Map
  function initMap() {
    const mapElement = document.getElementById('drone-leaflet-map');
    if (!mapElement || typeof L === 'undefined') return;

    const startPos = [WAYPOINTS[0].lat, WAYPOINTS[0].lon];
    const endPos = [WAYPOINTS[WAYPOINTS.length - 1].lat, WAYPOINTS[WAYPOINTS.length - 1].lon];

    map = L.map('drone-leaflet-map', {
      zoomControl: true,
      attributionControl: false
    }).setView(startPos, 14);

    // Dark-styled map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Draw planned mission path
    const latlngs = WAYPOINTS.map(w => [w.lat, w.lon]);
    pathPolyline = L.polyline(latlngs, {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.75,
      dashArray: '6, 8',
      smoothFactor: 1
    }).addTo(map);

    // Trajectory flown (solid cyan line)
    flownPolyline = L.polyline([startPos], {
      color: '#10b981',
      weight: 5,
      opacity: 0.95
    }).addTo(map);

    // Custom Start & End Markers
    const startIcon = L.divIcon({
      className: 'custom-map-pin start',
      html: '<div style="background:#10b981; color:#060913; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 12px #10b981; font-size:11px;">A</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const destIcon = L.divIcon({
      className: 'custom-map-pin dest',
      html: '<div style="background:#f43f5e; color:#ffffff; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 12px #f43f5e; font-size:11px;">B</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker(startPos, { icon: startIcon }).addTo(map).bindPopup('<b>Mission Origin</b><br>Burayyu Node 00');
    L.marker(endPos, { icon: destIcon }).addTo(map).bindPopup('<b>Destination Point</b><br>Target Arrival Coordinate');

    // Quadcopter Drone Icon
    const droneSvg = `
      <div id="drone-svg-pin" style="width:36px; height:36px; transform:translate(-18px, -18px) rotate(0deg); transition:transform 0.1s linear;">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="14" fill="#0284c7" stroke="#38bdf8" stroke-width="4"/>
          <line x1="15" y1="15" x2="85" y2="85" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
          <line x1="85" y1="15" x2="15" y2="85" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
          <circle cx="15" cy="15" r="9" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
          <circle cx="85" cy="15" r="9" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
          <circle cx="15" cy="85" r="9" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
          <circle cx="85" cy="85" r="9" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
          <polygon points="50,22 43,36 57,36" fill="#34d399"/>
        </svg>
      </div>`;

    const droneIcon = L.divIcon({
      className: 'drone-moving-icon',
      html: droneSvg,
      iconSize: [36, 36],
      iconAnchor: [0, 0]
    });

    droneMarker = L.marker(startPos, { icon: droneIcon, zIndexOffset: 1000 }).addTo(map);

    map.fitBounds(pathPolyline.getBounds(), { padding: [50, 50] });

    logMessage('Ground Station Initialized. Serial 9600 8N1 linked to ATmega328P.', 'success');
    logMessage('GPS NEO-6M 3D Fix Acquired (8 Satellites locked). Ready.');
  }

  function updateHUD(fsmState, wpIdx, lat, lon, dist, heading, speed) {
    if (elFsmState) elFsmState.textContent = fsmState;
    if (elWp) elWp.textContent = `${String(wpIdx).padStart(2, '0')} / ${WAYPOINTS.length}`;
    if (elLat) elLat.textContent = lat.toFixed(6);
    if (elLon) elLon.textContent = lon.toFixed(6);
    if (elDist) elDist.textContent = `${dist.toFixed(1)} m`;
    if (elHeading) elHeading.textContent = `${Math.round(heading)}°`;
    if (elSpeed) elSpeed.textContent = `${speed.toFixed(1)} m/s`;
    
    // Simulate slight natural attitude oscillations from MPU-6050
    const pitch = (Math.sin(Date.now() / 400) * 1.8).toFixed(1);
    const roll = (Math.cos(Date.now() / 350) * 1.4).toFixed(1);
    if (elPitch) elPitch.textContent = `${pitch > 0 ? '+' : ''}${pitch}°`;
    if (elRoll) elRoll.textContent = `${roll > 0 ? '+' : ''}${roll}°`;

    // Battery simulation
    if (simRunning && battery > 15) {
      battery -= 0.005;
      if (elBattery) elBattery.textContent = `${battery.toFixed(1)}%`;
    }

    // Rotate drone SVG to point in travel direction
    const droneSvg = document.getElementById('drone-svg-pin');
    if (droneSvg) {
      droneSvg.style.transform = `translate(-18px, -18px) rotate(${heading}deg)`;
    }
  }

  function simulationStep(timestamp) {
    if (!simRunning) return;

    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const totalWp = WAYPOINTS.length;

    if (!isRTH) {
      // Normal Outward Flight
      if (currentWpIndex >= totalWp - 1) {
        // Reached destination!
        simRunning = false;
        updateHUD('STATE_WAITING', currentWpIndex, WAYPOINTS[totalWp - 1].lat, WAYPOINTS[totalWp - 1].lon, 0, 0, 0);
        logMessage('Destination waypoint reached! Entering 5000ms loiter hold.', 'success');
        if (btnStart) btnStart.innerHTML = '<span>▶</span> Resume Mission';
        return;
      }

      const pA = WAYPOINTS[currentWpIndex];
      const pB = WAYPOINTS[currentWpIndex + 1];

      // Step progress between waypoints
      const legDist = haversineDistMeters(pA.lat, pA.lon, pB.lat, pB.lon);
      const speed = 4.2; // ~4.2 m/s cruising speed
      const legDuration = legDist / speed; // seconds
      
      progressInLeg += delta / (legDuration || 1);

      if (progressInLeg >= 1) {
        progressInLeg = 0;
        currentWpIndex++;
        logMessage(`[FSM] Captured Waypoint ${currentWpIndex}. Transitioning to next leg.`);
      }

      // Check for obstacle condition
      if (obstacleInjected && currentWpIndex >= 5 && currentWpIndex <= 8) {
        updateHUD('AVOIDING_OBSTACLE', currentWpIndex, pA.lat, pA.lon, legDist * (1 - progressInLeg), 110, 2.5);
      } else {
        const curLat = pA.lat + (pB.lat - pA.lat) * progressInLeg;
        const curLon = pA.lon + (pB.lon - pA.lon) * progressInLeg;
        const bearing = calculateBearing(curLat, curLon, pB.lat, pB.lon);
        const remDist = haversineDistMeters(curLat, curLon, pB.lat, pB.lon);

        if (droneMarker) droneMarker.setLatLng([curLat, curLon]);
        if (flownPolyline) flownPolyline.addLatLng([curLat, curLon]);

        updateHUD('STATE_NAVIGATING', currentWpIndex, curLat, curLon, remDist, bearing, speed);
      }
    } else {
      // Return To Home (RTH) in Reverse
      if (currentWpIndex <= 0) {
        simRunning = false;
        updateHUD('STATE_IDLE', 0, WAYPOINTS[0].lat, WAYPOINTS[0].lon, 0, 0, 0);
        logMessage('Return-to-Home complete! Drone landed safely at launch origin.', 'success');
        if (btnStart) btnStart.innerHTML = '<span>▶</span> Launch Mission';
        return;
      }

      const pA = WAYPOINTS[currentWpIndex];
      const pB = WAYPOINTS[currentWpIndex - 1];

      const legDist = haversineDistMeters(pA.lat, pA.lon, pB.lat, pB.lon);
      const speed = 5.0;
      const legDuration = legDist / speed;
      
      progressInLeg += delta / (legDuration || 1);

      if (progressInLeg >= 1) {
        progressInLeg = 0;
        currentWpIndex--;
        logMessage(`[RTH] Reverse Leg cleared. Current WP: ${currentWpIndex}`);
      }

      const curLat = pA.lat + (pB.lat - pA.lat) * progressInLeg;
      const curLon = pA.lon + (pB.lon - pA.lon) * progressInLeg;
      const bearing = calculateBearing(curLat, curLon, pB.lat, pB.lon);
      const remDist = haversineDistMeters(curLat, curLon, pB.lat, pB.lon);

      if (droneMarker) droneMarker.setLatLng([curLat, curLon]);
      if (flownPolyline) flownPolyline.addLatLng([curLat, curLon]);

      updateHUD('STATE_RETURNING', currentWpIndex, curLat, curLon, remDist, bearing, speed);
    }

    animFrameId = requestAnimationFrame(simulationStep);
  }

  function startSimulation() {
    if (simRunning) {
      simRunning = false;
      if (btnStart) btnStart.innerHTML = '<span>▶</span> Resume Mission';
      logMessage('Mission paused by operator.');
      updateHUD('STATE_IDLE', currentWpIndex, WAYPOINTS[currentWpIndex].lat, WAYPOINTS[currentWpIndex].lon, 0, 0, 0);
      cancelAnimationFrame(animFrameId);
    } else {
      simRunning = true;
      lastTime = 0;
      if (btnStart) btnStart.innerHTML = '<span>⏸</span> Pause Mission';
      logMessage('Autonomous flight loop engaged. Motors energized.', 'success');
      animFrameId = requestAnimationFrame(simulationStep);
    }
  }

  function injectObstacle() {
    obstacleInjected = !obstacleInjected;
    if (obstacleInjected) {
      if (btnObstacle) {
        btnObstacle.style.background = '#f43f5e';
        btnObstacle.style.color = '#ffffff';
        btnObstacle.innerHTML = '<span>⚡</span> Clear Obstacle';
      }
      const p = WAYPOINTS[Math.min(currentWpIndex + 2, WAYPOINTS.length - 1)];
      const obsIcon = L.divIcon({
        html: '<div style="background:#f43f5e; color:#fff; font-size:16px; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px #f43f5e;">⚠️</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      obstacleMarker = L.marker([p.lat, p.lon], { icon: obsIcon }).addTo(map);
      logMessage('[ALERT] Forward IR Sensor proximity trigger (<60cm)! Initiating star-board evasive bias.', 'warn');
    } else {
      if (btnObstacle) {
        btnObstacle.style.background = '';
        btnObstacle.style.color = '';
        btnObstacle.innerHTML = '<span>⚠️</span> Inject Obstacle';
      }
      if (obstacleMarker && map) {
        map.removeLayer(obstacleMarker);
        obstacleMarker = null;
      }
      logMessage('Obstacle cleared. Resuming nominal waypoint vector.', 'success');
    }
  }

  function triggerRTH() {
    isRTH = true;
    simRunning = true;
    lastTime = 0;
    logMessage('[COMMAND] RTH sequence executed! Quadcopter reversing trajectory to launch point.', 'warn');
    if (btnStart) btnStart.innerHTML = '<span>⏸</span> Pause Mission';
    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(simulationStep);
  }

  function resetSimulation() {
    simRunning = false;
    isRTH = false;
    obstacleInjected = false;
    currentWpIndex = 0;
    progressInLeg = 0;
    battery = 98.4;
    cancelAnimationFrame(animFrameId);

    if (btnStart) btnStart.innerHTML = '<span>▶</span> Launch Mission';
    if (btnObstacle) {
      btnObstacle.style.background = '';
      btnObstacle.style.color = '';
      btnObstacle.innerHTML = '<span>⚠️</span> Inject Obstacle';
    }
    if (obstacleMarker && map) {
      map.removeLayer(obstacleMarker);
      obstacleMarker = null;
    }

    const startPos = [WAYPOINTS[0].lat, WAYPOINTS[0].lon];
    if (droneMarker) droneMarker.setLatLng(startPos);
    if (flownPolyline) flownPolyline.setLatLngs([startPos]);

    updateHUD('STATE_IDLE', 0, WAYPOINTS[0].lat, WAYPOINTS[0].lon, 0, 0, 0);
    logMessage('Mission state reset. Quadcopter repositioned at launch origin.');
  }

  // Bind Event Listeners on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    initMap();

    if (btnStart) btnStart.addEventListener('click', startSimulation);
    if (btnObstacle) btnObstacle.addEventListener('click', injectObstacle);
    if (btnRth) btnRth.addEventListener('click', triggerRTH);
    if (btnReset) btnReset.addEventListener('click', resetSimulation);
  });
})();
