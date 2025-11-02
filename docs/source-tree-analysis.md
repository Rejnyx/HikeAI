
# Source Tree Analysis

This document provides an annotated overview of the project's directory structure, focusing on the most critical files and folders for development.

---

## High-Level Structure

The project is a multi-part application composed of a `backend` and a `mobile` part.

```
hike-ai/
├── backend/          # Node.js API Server
├── mobile/           # React Native Mobile App
├── docs/             # All project documentation
└── bmad/             # BMAD method & workflow definitions
```

---

## Backend (`backend/src`)

The backend contains the core business logic, API endpoints, and communication with external services.

```
backend/src/
│
├── routes/             # API endpoint definitions (Express.js).
│   └── routes.js       # Defines all public endpoints like /generate, /:id, etc.
│
├── services/           # Core business logic and external service clients.
│   ├── routeGenerator.js # ★ The main orchestrator for AI route generation.
│   ├── mapyczRouting.js  # Client for the Mapy.cz Routing API.
│   ├── geocoding.js      # Client for the Mapy.cz Geocoding API with caching.
│   └── supabase.js       # Data Access Layer (DAL) for all Supabase database operations.
│
├── middleware/         # Express.js middleware.
│   └── rateLimiter.js  # Handles API rate limiting to prevent abuse.
│
├── utils/              # Reusable helper functions.
│   └── gpx.js          # Handles GPX file generation and route statistics calculations.
│
└── index.js            # Application entry point: initializes and starts the Express server.
```

---

## Mobile (`mobile/src`)

The mobile app contains all the UI, navigation, and client-side logic.

```
mobile/src/
│
├── screens/            # Top-level screen components, one for each tab.
│   └── RoutesScreen.js   # ★ The core, functional screen with the map and user interaction.
│
├── components/         # Reusable, complex UI components.
│   ├── PlaceDetailSheet.js # Bottom sheet showing details for a selected map location.
│   └── RouteInputModal.js  # Modal dialog for building the AI generation prompt.
│
├── navigation/         # Navigation setup for the app.
│   └── MainNavigator.js  # Defines the main Bottom Tab Navigator and its screens.
│
├── theme/              # Global styling configuration.
│   ├── colors.js       # App color palette.
│   └── typography.js   # Font styles and sizes.
│
├── config/             # Configuration files.
│   └── api.js          # Defines API endpoints and timeouts.
│
└── utils/              # Client-side helper functions.
    └── distance.js     # Functions for distance calculations.
```
