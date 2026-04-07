# Capacitor & Native Setup Checklist

Follow these steps after initializing the React project to ensure native features (Camera, GPS) work on Android and iOS.

## 1. Initial Setup
- [ ] Install dependencies: `npm install @capacitor/camera @capacitor/geolocation @capacitor/core`
- [ ] Initialize Capacitor: `npx cap init [appName] [appId]`
- [ ] Add platforms: `npx cap add android`, `npx cap add ios`

---

## 2. Android Configuration (`android/app/src/main/AndroidManifest.xml`)
- [ ] **Camera Permissions**:
    ```xml
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    ```
- [ ] **GPS Permissions**:
    ```xml
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" />
    ```

---

## 3. iOS Configuration (`ios/App/App/Info.plist`)
- [ ] **Camera Usage Description**:
    - Key: `NSCameraUsageDescription`
    - Value: "CIVIX needs camera access to take photos of civic issues."
- [ ] **GPS Usage Description**:
    - Key: `NSLocationWhenInUseUsageDescription`
    - Value: "CIVIX needs your location to accurately report where issues are located."
- [ ] **Photo Library Description**:
    - Key: `NSPhotoLibraryUsageDescription`
    - Value: "CIVIX needs access to your gallery to upload existing photos."

---

## 4. Build Flow (The "Sync" Pipeline)
1.  **Build React**: `npm run build`
2.  **Sync to Native**: `npx cap sync`
3.  **Open Native IDE**: `npx cap open android` or `npx cap open ios`
4.  **Run**: Press "Play" in Android Studio or Xcode.

---

### Pro-Tip for Hackathons: 
> [!IMPORTANT]
> Always run `npx cap sync` after every React build. If your native code doesn't reflect your JS changes, this is usually the culprit.
