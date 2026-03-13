# DECP Mobile App

Department Engagement & Career Platform - Mobile companion app for students, alumni, and admins.

## Features

- **Authentication**: Secure login and registration
- **Feed**: Browse and interact with posts from the community
- **Jobs & Internships**: Discover and apply to opportunities
- **Events**: Browse events and RSVP
- **Messaging**: Direct messaging with other users
- **Research Projects**: Collaborate on research initiatives
- **Notifications**: Stay updated with real-time notifications
- **Profile Management**: Manage your professional profile

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **TanStack Query** for server state management
- **Zustand** for auth state
- **Axios** for API calls
- **React Hook Form** for form handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
The `.env` file is already set up with:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

Update this URL to point to your backend API.

3. Run the app:

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Web:**
```bash
npm run web
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── navigation/       # Navigation setup
├── screens/          # Screen components
├── services/         # API service layer
├── store/            # Global state (Zustand)
├── theme/            # Design tokens
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## API Integration

The app connects to the backend API at the configured base URL. All endpoints are abstracted through the `api` service in `src/services/api.ts`.

## Design System

The app uses a premium dark theme with:
- Near-black graphite backgrounds
- Soft white primary text
- Electric blue-violet accents
- Consistent spacing scale
- Minimal surfaces with subtle depth

## State Management

- **Auth State**: Managed with Zustand (`useAuthStore`)
- **Server State**: Managed with TanStack Query
- **Token Management**: Automatic refresh with interceptors

## Key Features

- Optimistic UI updates for likes and RSVPs
- Pull-to-refresh on all list screens
- Automatic token refresh
- Offline error handling
- Clean empty states
- Accessible touch targets
