
# UI Components & Screens - Mobile

**Part:** `mobile`

This document provides an inventory and description of the main UI screens and reusable components in the HikeAI mobile application.

---

## Screens

The `mobile/src/screens` directory contains the top-level views of the application, orchestrated by the navigation logic.

### 1. `RoutesScreen.js` (Core Screen)

This is the primary and most feature-rich screen in the application.

- **Purpose:** The main interface for users to search for places, view existing routes, and generate new AI-powered routes.
- **Key Features:**
    - **Interactive Map (`MapView`):** Displays the user's location, points of interest (POIs), and route polylines.
    - **Search Bar:** Allows users to search for locations. It uses a debounced search to call the backend suggest API and displays results in a categorized list.
    - **Route Display:** Fetches and displays existing routes from the backend in a horizontal scrolling list within a bottom sheet.
    - **Route Generation:** Integrates the `RouteInputModal` to allow users to start the AI route generation process.
    - **Place Details:** Integrates the `PlaceDetailSheet` to show information about a selected POI.
    - **Generated Route Visualization:** Displays the newly generated route polyline, start/end markers, and POIs on the map.

### 2. Placeholder Screens

The following screens are currently implemented as placeholders and do not contain functional logic. They display a title and a "Coming soon..." message.

- **`HomeScreen.js`**
- **`ProfileScreen.js`**
- **`RecordScreen.js`**
- **`ShopScreen.js`**

---

## Reusable Components

The `mobile/src/components` directory contains complex, reusable UI modules that encapsulate specific functionalities.

### 1. `PlaceDetailSheet.js`

A bottom sheet component that provides detailed information about a selected point of interest.

- **Trigger:** Appears when a user taps on a POI marker on the map.
- **Data Fetching:** Asynchronously fetches additional data when it opens:
    - **Photos:** Fetches an image from a custom Wikimedia Commons endpoint, with a fallback to Unsplash.
    - **Description:** Fetches a text description from a custom Wikipedia endpoint.
    - **Statistics:** Calculates the distance from the user and fetches the number of nearby routes from the backend.
- **User Actions:**
    - `Plan Route Here`: Opens the `RouteInputModal` to start route generation with the selected place as context.
    - `View Routes`: Expands the main bottom sheet to show routes near the selected place.
    - `Save`: A button to mark the place as a favorite (UI only, no backend logic yet).

### 2. `RouteInputModal.js`

A modal dialog for initiating the AI route generation.

- **Trigger:** Opened by tapping the "Plan New Route" button or the "Plan Route Here" button in the `PlaceDetailSheet`.
- **Functionality:**
    - **Prompt Construction:** Allows the user to build a detailed prompt for the AI.
    - **Quick Ideas:** Provides predefined buttons (e.g., "Round trip", "To train") that append common instructions to the prompt.
    - **Custom Input:** A text area for users to write their own detailed request.
- **Action:** Constructs the final prompt string and passes it to the `onGenerate` callback, which triggers the API call to the backend's `/routes/generate` endpoint.
