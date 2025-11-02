
# Navigation - Mobile

**Part:** `mobile`
**Source:** `mobile/src/navigation/MainNavigator.js`

This document describes the navigation structure of the HikeAI mobile application, which is built using React Navigation.

---

## Navigation Type: Bottom Tab Navigator

The application's primary navigation is a **Bottom Tab Navigator** (`@react-navigation/bottom-tabs`). This provides a persistent menu at the bottom of the screen, allowing users to switch between the main sections of the app.

While `@react-navigation/stack` is included as a dependency, it is not actively used. Detail views and modals are currently handled within the `RoutesScreen` itself (e.g., `PlaceDetailSheet`, `RouteInputModal`).

---

## Tab Structure

There are five tabs configured, each with a specific screen, icon, and a Czech label.

| # | Label | Screen Component | Status |
|---|---|---|---|
| 1 | Domů | `HomeScreen.js` | **Placeholder** |
| 2 | Trasy | `RoutesScreen.js` | ✅ **Functional** (Core Screen) |
| 3 | Záznam | `RecordScreen.js` | **Placeholder** |
| 4 | Profil | `ProfileScreen.js` | **Placeholder** |
| 5 | Obchod | `ShopScreen.js` | **Placeholder** |

### Screen Details:

-   **`HomeScreen`:** Intended to be the main landing screen, but is currently a placeholder.
-   **`RoutesScreen`:** The core functional screen of the app where users can search, view, and generate routes.
-   **`RecordScreen`:** Placeholder for a future screen, likely intended for tracking a user's hike in real-time.
-   **`ProfileScreen`:** Placeholder for a user profile section.
-   **`ShopScreen`:** Placeholder for a potential e-commerce section.
