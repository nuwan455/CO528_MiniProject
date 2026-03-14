# DECP Mobile App

Department Engagement & Career Platform mobile app built with Expo and React Native.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file from the example:

```bash
copy .env.example .env
```

3. Choose the API target in `.env`:

```env
EXPO_PUBLIC_API_TARGET=emulator
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_API_LAN_BASE_URL=http://192.168.1.10:4000/api/v1
EXPO_PUBLIC_API_REMOTE_BASE_URL=https://140.245.230.95.sslip.io/api/v1
```

## API Modes

- `emulator`: for Android emulator or iOS simulator. `localhost` becomes `10.0.2.2` on Android automatically.
- `lan`: for a real phone APK talking to your backend running on your PC over Wi-Fi.
- `remote`: for a deployed backend server.

## Run Locally

Android emulator:

```bash
npm start
npm run android
```

Real phone on same Wi-Fi:

```bash
# set EXPO_PUBLIC_API_TARGET=lan in .env
npm start
```

Make sure your backend is reachable from your phone using your PC's LAN IP, for example:

```env
EXPO_PUBLIC_API_LAN_BASE_URL=http://192.168.1.10:4000/api/v1
```

## Build APK with EAS

Log in and configure EAS once:

```bash
npx eas login
npx eas build:configure
```

### Local/LAN APK

Update `eas.json` with your actual LAN IP, then build:

```bash
npx eas build -p android --profile preview-local
```

### Remote Server APK

The remote profile is already configured to use:

```text
https://140.245.230.95.sslip.io/api/v1
```

Build with:

```bash
npx eas build -p android --profile preview-remote
```

### Production AAB

```bash
npx eas build -p android --profile production
```

## Files

- `src/services/api.ts`: runtime API target resolver
- `.env.example`: local environment template
- `eas.json`: EAS build profiles for LAN and remote builds
