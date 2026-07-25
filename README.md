# Smart Bus Tracking System

## Overview
The **Smart Bus Tracking System** is a real-time bus tracking and ETA prediction platform tailored for public transportation. It aims to solve the problem of unpredictable waiting times by allowing passengers to track buses on an interactive map, view routes, and see real-time distance and estimated arrival times (ETA).

## Features
- **Real-Time GPS Tracking:** Drivers transmit their live location every 5 seconds.
- **Interactive Maps:** Passengers can view buses moving in real-time on a map.
- **Distance & ETA Calculation:** Dynamic calculations based on current location and target bus stops.
- **Admin Dashboard:** For managing buses, routes, stops, and drivers.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS, Leaflet & React Leaflet (Mapping), Socket.io-client.
- **Backend:** Node.js, Express.js, TypeScript, Socket.io (WebSockets).
- **Database:** MongoDB (with Mongoose).

## Actual System Workflow
1. **Driver Initialization:** A driver opens the driver application, logs in, and selects a route to start a trip.
2. **GPS Transmission:** The driver app accesses device GPS and emits `location_update` events via Socket.IO every 5 seconds to the Node.js server.
3. **Backend Processing:** The Node.js server receives these coordinates, stores necessary tracking logs in MongoDB, and broadcasts a `bus_location` event to all passenger clients subscribed to that route.
4. **Passenger Tracking:** A passenger opens the web app, searches for a route, and views the map. The Leaflet map listens to WebSocket events and smoothly transitions the bus markers to their new coordinates.
5. **Distance & ETA Generation:** When a passenger interacts with a specific stop, the system calculates the distance from the moving bus to that stop to display how far away the bus is.

## Distance Calculation Algorithm (Haversine Formula)
When a passenger clicks on a specific stop on the map, the application calculates the distance between the selected stop and the current location of the approaching bus using the **Haversine Algorithm**. 

This allows the UI to display information such as: **"1.2km away - Bus: Ba 4 Kha 1234"**.

### Algorithm Implementation Example
```javascript
/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 * @param {number} lat1 - Latitude of point 1 (e.g., Bus)
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2 (e.g., Bus Stop)
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const toRadians = (degree) => degree * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c; 
  return parseFloat(distance.toFixed(2)); // Returns distance rounded to 2 decimal places
}

// --- Workflow when a user clicks a stop ---
// Assume we have the active bus object and the clicked stop object

const activeBus = { name: "Ba 4 Kha 1234", lat: 27.7172, lng: 85.3240 };
const clickedStop = { name: "Ratnapark Stop", lat: 27.7061, lng: 85.3148 };

// 1. Calculate Distance
const distanceKm = calculateHaversineDistance(
  activeBus.lat, 
  activeBus.lng, 
  clickedStop.lat, 
  clickedStop.lng
);

// 2. Display to User
const displayMessage = `${distanceKm}km away - Bus: ${activeBus.name}`;
console.log(displayMessage); // Output: "1.52km away - Bus: Ba 4 Kha 1234"
```

## Setup Instructions
To run this project locally, you need Node.js and `pnpm` installed.

### 1. Backend Setup
```bash
cd backend
pnpm install
# Create a .env file and configure MongoDB and JWT secrets
pnpm run dev
```

### 2. Frontend Setup
```bash
cd frontend
pnpm install
# Ensure environment variables point to your backend API
pnpm run dev
```
The frontend will be available at `http://localhost:3000`.
