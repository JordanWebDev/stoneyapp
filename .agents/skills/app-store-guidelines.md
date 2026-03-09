# App Store Guidelines

This skill documents key Apple App Store and Google Play Store submission
requirements.

## Submission Checklist

- **Metadata**: Ensure app name, descriptions, and keywords are professional.
- **Privacy Policy**: A public link to the privacy policy is mandatory.
- **Safety**: Content must be suitable for all ages or marked appropriately.
- **Microphone/Camera**: If using any sensors, provide clear usage strings
  in `app.json`.

## Platform-Specific Prep

- **iOS**: Ensure `bundleIdentifier` is unique and follows the
  `com.yourdomain.app` format.
- **Android**: Set a unique `package` name and increment the `versionCode` for
  each release.
