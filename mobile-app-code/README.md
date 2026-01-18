# BantayAni Mobile App (React Native / Expo)

This folder contains React Native code for the farmer-side mobile application.
**Note:** Lovable runs web apps only. Export these files to use in your Expo project.

## Setup Instructions

1. Create a new Expo project:
```bash
npx create-expo-app bantayani-mobile --template expo-template-blank-typescript
cd bantayani-mobile
```

2. Install dependencies:
```bash
npx expo install expo-camera expo-location expo-file-system @react-native-async-storage/async-storage
npm install zustand nativewind tailwindcss
```

3. Copy the files from this folder to your Expo project's `src/` directory.

4. Configure NativeWind by following: https://www.nativewind.dev/getting-started/expo-router

## File Structure
- `screens/CameraScreen.tsx` - Live detection camera with auto-capture
- `screens/HistoryScreen.tsx` - Past detection history
- `services/uploadService.ts` - Metadata packaging & upload logic
- `store/captureStore.ts` - Zustand state for captures
