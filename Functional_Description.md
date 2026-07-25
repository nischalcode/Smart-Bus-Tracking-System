# Functional Description for Diagram Generation

This document provides a detailed breakdown of the functional components, actors, and workflows of the Smart Bus Tracking System. You can use these descriptions as direct inputs for generating UML diagrams (Use Case, Sequence, Activity, Class, etc.).

---

## 1. Actors (Entities interacting with the system)
1. **Passenger (Unauthenticated User):** Anyone who accesses the web application to view bus locations, routes, and ETAs.
2. **Driver (Authenticated User):** A registered bus driver who logs into the system to transmit GPS coordinates during a trip.
3. **Admin (Authenticated User):** A system administrator who manages the fleet, routes, stops, and user accounts.
4. **System (Backend/Server):** The central Node.js/Express application that processes data, manages sockets, and interacts with the database.

---

## 2. Functional Modules & Use Cases

### A. Passenger Module (Use Cases)
- **View Interactive Map:** Passenger views the Leaflet map with real-time bus locations.
- **Search and Select Route:** Passenger selects a specific route to see only the buses and stops associated with that route.
- **View Bus Stops:** Passenger clicks on a bus route to see all predefined stops along that route.
- **View Real-Time ETA:** Passenger clicks on a bus stop to calculate and view the distance and estimated time of arrival of approaching buses (using the Haversine formula).

### B. Driver Module (Use Cases)
- **Driver Login:** Driver authenticates using their credentials (Phone/Email and Password).
- **Select Route & Start Trip:** Driver selects the route they are assigned to and clicks "Start Trip".
- **Transmit Location Data:** The driver's app automatically fetches device GPS coordinates and emits them to the server every 5 seconds.
- **End Trip:** Driver ends the trip, stopping the GPS transmission.

### C. Admin Module (Use Cases)
- **Admin Login:** Admin securely logs into the dashboard.
- **Manage Buses:** Add, update, view, or remove bus details (Bus Number, Capacity).
- **Manage Routes & Stops:** Define routes using geographical paths (GeoJSON LineStrings) and place bus stops (Point data).
- **Manage Drivers:** Register new drivers and assign them to specific buses.
- **Monitor Fleet:** View a master dashboard showing the live location of all active buses across all routes.

---

## 3. Workflow Descriptions (For Activity & Sequence Diagrams)

### Workflow 1: Real-Time Location Tracking (Core Sequence)
1. **Driver App** requests the current latitude and longitude from the mobile device's Geolocation API.
2. **Driver App** emits a `location_update` event via Socket.IO containing `[latitude, longitude, busId, routeId]`.
3. **System Server** receives the event, updates the latest coordinates in its temporary state (or Redis/Memory), and logs it to MongoDB for history.
4. **System Server** broadcasts a `bus_location` event to the specific Socket.IO "room" associated with that `routeId`.
5. **Passenger App** (subscribed to that route's room) receives the `bus_location` event.
6. **Passenger App** updates the React state, which triggers Leaflet to move the bus marker on the map.

### Workflow 2: ETA Calculation (Activity Flow)
1. Passenger selects a specific **Bus Stop** on the map.
2. System identifies the active **Bus** approaching that stop on the same route.
3. System extracts the `latitude` and `longitude` of the Bus and the Stop.
4. System calculates the distance using the **Haversine Algorithm**.
5. System divides the calculated distance by the average moving speed of the bus.
6. System displays the result (e.g., "1.2km away, Arriving in ~4 mins") on the Passenger's screen.

### Workflow 3: Driver Trip Lifecycle (State/Activity Flow)
- **Initial State:** Driver is logged out.
- **State 1 (Idle):** Driver logs in successfully. Selects a route.
- **State 2 (Active/In-Transit):** Driver clicks "Start Tracking". The socket connection is established. GPS loop begins (every 5 seconds).
- **State 3 (Ended):** Driver clicks "Stop Tracking". Socket connection closes. Trip log is finalized in the database. Returns to Idle State.

---

## 4. Key Data Entities (For Class Diagrams)

- **User / Driver:**
  - Attributes: `id`, `name`, `email/phone`, `passwordHash`, `role (ADMIN/DRIVER)`.
  - Methods: `login()`, `logout()`, `updateProfile()`.

- **Bus:**
  - Attributes: `busId`, `licensePlate`, `capacity`, `currentStatus (ACTIVE/IDLE)`.

- **Route:**
  - Attributes: `routeId`, `routeName`, `pathCoordinates` (Array of Lat/Lng objects).

- **Stop:**
  - Attributes: `stopId`, `stopName`, `location` (Lat/Lng).



---
*Tip for Diagramming Tools:* You can copy-paste the sections above directly into AI tools (like ChatGPT, Claude, or diagramming tools like PlantUML, Mermaid.js) to instantly generate visual UML diagrams.
