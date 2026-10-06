# Smart Bus Tracking & Management System (SBTS)

A real-time web-based **Smart Bus Tracking & Management System** designed for public bus transportation in Nepal, especially the Kathmandu Valley.

The system helps passengers find buses, view routes and schedules, track buses on a map, receive service notifications, and provide feedback. It also provides an administrative platform for managing buses, drivers, routes, schedules, delays, and system operations.

> **Project Type:** Final Year / Academic Project  
> **Domain:** Public Transportation / Real-Time Tracking  
> **Target Region:** Nepal / Kathmandu Valley

---

## 📌 Overview

Public transportation users often have difficulty knowing:

- Where a bus currently is
- Which route a bus follows
- When a bus is expected to arrive
- Whether a bus is delayed
- Why a route is delayed or disrupted
- Which buses and drivers are currently active

SBTS addresses these problems by combining **GPS-based bus tracking, interactive maps, route management, ETA estimation, notifications, and role-based administration** in one platform.

The system is designed to support multiple bus companies and can be extended for use by a municipality, transport authority, or government organization.

---

## 🎯 Objectives

- Provide real-time bus location tracking.
- Allow passengers to search and view available bus routes.
- Display buses and routes on an interactive map.
- Provide estimated arrival information (ETA).
- Show delays and possible causes of delays.
- Allow administrators to manage buses, drivers, routes, and schedules.
- Verify and manage drivers before assigning them to buses/routes.
- Provide notifications for important route and service updates.
- Collect passenger feedback.
- Provide role-based access and secure authentication.
- Create a scalable foundation for a government-managed public transportation platform.

---

## ✨ Main Features

### 👤 Passenger / Public Features

- View available bus routes.
- Search and filter routes.
- View bus stops and route information.
- Track active buses on an interactive map.
- View bus movement and current location.
- View estimated arrival time where available.
- View route delays and disruption information.
- Receive service notifications.
- Submit feedback.
- Responsive interface for desktop and mobile devices.
- English / Nepali interface support.

### 🚌 Bus Tracking

- GPS-based bus location updates.
- Live bus position on the map.
- Driver/bus tracking during active trips.
- Route-based bus tracking.
- Last known location handling.
- Bus status such as active/inactive.
- Real-time communication using Socket.IO.

### 🗺️ Route Management

Administrators can manage:

- Routes
- Route names
- Start and destination points
- Stops
- Route paths
- Assigned buses
- Route schedules
- Route status

Example:

`Ratna Park → Balkumari`

The system can display the route and active buses traveling along it.

### ⏱️ ETA & Delay Management

The system can estimate bus arrival based on available tracking information.

It can also represent:

- Current bus position
- Distance to destination/stop
- Estimated arrival
- Delayed status
- Delay reason

Possible delay reasons include:

- Traffic congestion
- Road construction
- Vehicle breakdown
- Accident
- Weather
- Route obstruction
- Other operational issues

### 👨‍✈️ Driver Management

Administrators can:

- Register drivers
- Verify drivers
- Update driver information
- Activate/deactivate drivers
- Assign verified drivers to buses
- Assign drivers to routes/trips

Only verified drivers should be allowed to operate within the system.

### 🚌 Bus Management

Administrators can:

- Add buses
- Update bus information
- View bus details
- Assign buses to routes
- Assign drivers
- Activate/deactivate buses
- Monitor bus status

The architecture supports buses belonging to different transportation companies.

### 🔔 Notifications

Notifications can be used for:

- Route changes
- Delays
- Service interruptions
- Bus availability
- Important announcements
- Administrative messages

### 💬 Feedback

Passengers can submit feedback regarding:

- Bus service
- Route problems
- Driver/service experience
- Delays
- General suggestions

Administrators can review feedback and use it to improve the service.

---

# 🔐 Role-Based Architecture

The planned system uses a **Super Admin + Admin** structure.

## Super Admin

The Super Admin represents the organization/head authority responsible for controlling the overall system.

Responsibilities may include:

- Manage administrators
- Approve/register transport organizations
- Manage system-wide settings
- Monitor all buses and routes
- Manage users and permissions
- View system-wide reports
- Handle administrative access

The Super Admin is the highest-privileged role.

## Admin

An Admin manages day-to-day transportation operations.

Depending on the organization's scope, an Admin can:

- Manage buses
- Manage drivers
- Verify drivers
- Manage routes
- Assign buses
- Assign drivers
- Manage schedules
- Monitor active buses
- Manage delays
- Send notifications
- Review feedback

This structure allows the system to support **multiple administrators** without giving every administrator full system control.

---

# 🏗️ System Architecture

```text
                        ┌─────────────────────┐
                        │       Users         │
                        │ Passenger / Driver  │
                        │      / Admin        │
                        └──────────┬──────────┘
                                   │
                                   ▼
                     ┌─────────────────────────┐
                     │      Next.js Frontend   │
                     │ React + TypeScript      │
                     │ Tailwind CSS             │
                     │ Leaflet Maps             │
                     └────────────┬────────────┘
                                  │ REST API
                                  │ WebSocket
                                  ▼
                     ┌─────────────────────────┐
                     │     Express Backend     │
                     │       Node.js/TS        │
                     │                         │
                     │ Auth / Routes / Buses   │
                     │ Drivers / Tracking      │
                     │ Notifications / etc.    │
                     └───────┬─────────┬───────┘
                             │         │
                 ┌───────────┘         └────────────┐
                 ▼                                  ▼
       ┌──────────────────┐               ┌──────────────────┐
       │ MongoDB Atlas    │               │    Socket.IO     │
       │ Database         │               │ Real-time events │
       └──────────────────┘               └──────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Leaflet**
- **React Leaflet**
- **Lucide React**
- **Socket.IO Client**

## Backend

- **Node.js**
- **Express.js**
- **TypeScript**
- **MongoDB**
- **Mongoose**
- **JWT**
- **Socket.IO**

## Development Tools

- Git
- GitHub
- VS Code
- pnpm / npm
- Postman
- MongoDB Atlas

---

# 📁 Project Structure

The project is separated into frontend and backend applications.

```text
Smart-Bus-Tracking-System/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── .env
│   ├── package.json
│   └── ...
│
└── README.md
```

> Folder names may differ slightly depending on the current implementation. The important architectural separation is **frontend + backend**.

---

# 🗄️ Main Data Models

The backend can contain models/entities such as:

### User

```text
User
├── name
├── email
├── password
├── role
├── phone
├── status
└── timestamps
```

### Bus

```text
Bus
├── busNumber
├── registrationNumber
├── company
├── route
├── driver
├── status
└── timestamps
```

### Driver

```text
Driver
├── name
├── phone
├── licenseNumber
├── verificationStatus
├── assignedBus
├── assignedRoute
└── timestamps
```

### Route

```text
Route
├── name
├── startPoint
├── destination
├── stops
├── path
├── assignedBuses
├── schedule
└── status
```

### Bus Location

```text
BusLocation
├── bus
├── latitude
├── longitude
├── speed
├── heading
└── timestamp
```

### Notification

```text
Notification
├── title
├── message
├── type
├── target
├── createdBy
└── timestamps
```

### Feedback

```text
Feedback
├── user
├── subject
├── message
├── status
└── timestamps
```

---

# 🔄 Real-Time Tracking Flow

The basic tracking flow is:

```text
Driver / GPS Device
        │
        │ GPS coordinates
        ▼
Frontend / Tracking Client
        │
        │ Socket.IO / API
        ▼
Backend Server
        │
        ├── Validate data
        ├── Update bus location
        └── Broadcast location
                │
                ▼
          Connected Users
                │
                ▼
          Live Map Marker
```

For project demonstration, a **phone can be used as the GPS source** to simulate the location of a real bus.

This makes it possible to demonstrate live tracking without requiring a dedicated GPS device installed in a bus.

---

# 🧮 Algorithms / Smart Features

The system can use practical algorithms to improve transportation information.

## 1. Distance Calculation

GPS coordinates can be used to calculate the approximate distance between a bus and a destination/stop.

A common approach is the **Haversine formula**.

```text
Distance = Haversine(
    currentLatitude,
    currentLongitude,
    destinationLatitude,
    destinationLongitude
)
```

## 2. ETA Estimation

A basic ETA can be estimated using:

```text
ETA = Distance / Average Speed
```

A more advanced implementation can incorporate:

- Current speed
- Historical travel time
- Route distance
- Traffic conditions
- Previous delay patterns

## 3. Nearest Bus

The system can calculate the distance between the passenger's location and active buses and return the closest suitable bus.

## 4. Route Matching

A bus location can be compared with route coordinates to determine whether the bus is following its assigned route.

## 5. Delay Detection

The system can compare expected travel time with actual travel time.

```text
Delay = Actual Travel Time - Expected Travel Time
```

A configurable threshold can then classify a bus as delayed.

---

# 🔑 Authentication & Security

The backend uses secure authentication concepts such as:

- JWT-based authentication
- Password hashing
- Protected API routes
- Role-based authorization
- Driver verification
- Admin authorization
- Environment variables for secrets
- Input validation
- CORS configuration

Sensitive values should never be committed to GitHub.

Example:

```env
PORT=9005
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:3000
```

Create a `.env` file locally and add it to `.gitignore`.

---

# 🚀 Getting Started

## Prerequisites

Install:

- Node.js
- pnpm or npm
- MongoDB Atlas account
- Git

Optional but recommended:

- Postman
- VS Code

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/Smart-Bus-Tracking-System.git
cd Smart-Bus-Tracking-System
```

---

## 2. Install Frontend Dependencies

```bash
cd frontend
pnpm install
```

or:

```bash
npm install
```

---

## 3. Configure Frontend Environment Variables

Create:

```text
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:9005/api
```

Use the actual backend port configured in your project.

---

## 4. Install Backend Dependencies

Open another terminal:

```bash
cd backend
pnpm install
```

or:

```bash
npm install
```

---

## 5. Configure Backend Environment Variables

Create:

```text
backend/.env
```

Example:

```env
PORT=9005
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

## 6. Start Backend

```bash
cd backend
pnpm dev
```

or:

```bash
npm run dev
```

---

## 7. Start Frontend

In another terminal:

```bash
cd frontend
pnpm dev
```

or:

```bash
npm run dev
```

Open the frontend URL shown in the terminal, normally:

```text
http://localhost:3000
```

---

# 🧪 Testing

The system can be tested using:

### Frontend

- Desktop browser
- Mobile browser
- Chrome DevTools responsive mode

### Backend

Use **Postman** to test:

- Authentication
- User management
- Bus CRUD
- Driver CRUD
- Route CRUD
- Schedule management
- Tracking APIs
- Notifications
- Feedback

### Real-Time Tracking

For the academic demonstration:

1. Open the tracking interface.
2. Use a phone as the GPS source.
3. Allow location access.
4. Send GPS coordinates to the backend.
5. Observe the bus marker moving on the map.
6. Open another device/browser as a passenger.
7. Verify that the location updates in real time.

---

# 📊 CRUD Operations

CRUD is used throughout the management system.

| Entity | Create | Read | Update | Delete |
|---|---:|---:|---:|---:|
| Buses | ✅ | ✅ | ✅ | ✅ |
| Drivers | ✅ | ✅ | ✅ | ✅ |
| Routes | ✅ | ✅ | ✅ | ✅ |
| Schedules | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Feedback | ✅ | ✅ | ✅ | Optional |
| Users/Admins | ✅ | ✅ | ✅ | Controlled |

For important operational data, **soft deletion/deactivation** can be preferred over permanent deletion.

---

# 🌐 Future Scope

The system can be extended with:

- Dedicated GPS/IoT devices installed in buses
- Mobile applications for Android/iOS
- Traffic API integration
- Machine-learning-based ETA prediction
- Historical route analytics
- Passenger demand prediction
- Automatic route optimization
- Digital fare/ticketing
- QR-based ticketing
- Government transport authority integration
- Multi-city support
- Multi-language expansion
- Emergency alerts
- Driver behavior monitoring
- Fleet maintenance management
- Advanced transportation dashboards

---

# 🏛️ Government-Scale Deployment Concept

For a government-managed version, the system can operate as a centralized transportation platform.

```text
                    Government / Transport Authority
                              │
                         Super Admin
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
          Admin A          Admin B          Admin C
        Company/Area 1   Company/Area 2   Company/Area 3
              │               │                │
          Buses/Drivers    Buses/Drivers    Buses/Drivers
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                     Central SBTS Platform
                              │
                              ▼
                         Passengers
```

This architecture allows different transportation operators to be managed under a common platform while keeping administrative permissions controlled.

---

# 🎓 Academic Significance

SBTS demonstrates practical implementation of:

- Full-stack web development
- REST API development
- Authentication and authorization
- Role-based access control
- MongoDB database design
- CRUD operations
- Real-time communication
- GPS/location services
- Interactive digital maps
- Geospatial calculations
- ETA estimation
- Responsive UI design
- Software architecture
- System analysis and design

The project can therefore serve as a practical demonstration of how modern software engineering can be applied to public transportation problems in Nepal.

---

# 🤝 Contribution

Contributions and suggestions are welcome.

For major changes:

1. Create a feature branch.
2. Make the changes.
3. Test frontend and backend.
4. Commit the changes.
5. Create a pull request.

Example:

```bash
git checkout -b feature/bus-tracking-improvement
git add .
git commit -m "Improve real-time bus tracking"
git push origin feature/bus-tracking-improvement
```

---

# 📄 License

This project is developed as an academic/project implementation.

If this system is later deployed commercially or by a government organization, licensing and ownership should be defined according to the organization responsible for deployment.

---

# 👨‍💻 Project

**Smart Bus Tracking & Management System (SBTS)**

Built to explore how real-time technology can make public transportation in Nepal more **accessible, predictable, transparent, and efficient**.
