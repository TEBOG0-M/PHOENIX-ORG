# PHOENIX ORG

A digital platform supporting education, mentorship and youth development.

This repository contains the PHOENIX ORG Android application and supporting project materials. The Android application uses Firebase Authentication and Cloud Firestore.

## Project components

| Component | Location | Status |
|---|---|---|
| Android application | `mobile-app/` | Kotlin, Jetpack Compose, Firebase |
| GitHub Actions | `.github/workflows/android-ci.yml` | Android build and unit-test workflow |
| Azure Pipelines | `azure-pipelines.yml` | Existing pipeline configuration; scope depends on its configured jobs |
| Website | `website/` | Separate website project; not part of the Android Firebase implementation |
| Legacy API/database assets | `api/` | Existing PHP/MySQL materials; not used as the Android app's data layer |

## Android application

The Android app provides the mobile experience for organisational information, missions/programmes, news, volunteer applications and contact enquiries. Available functionality depends on the configured Firebase project, Firestore data and deployed security rules.

### Technology

- Kotlin
- Jetpack Compose and Material 3
- Android Navigation Compose
- Firebase Authentication
- Cloud Firestore
- Kotlin Coroutines and Flow
- AndroidX Lifecycle
- DataStore Preferences (where used)

The Android namespace and application ID remain `com.mamelodiinitiative` for Firebase application compatibility.

## Firebase data contract

The Android application is aligned to the shared Firestore collection conventions:

| Collection | Purpose |
|---|---|
| `users` | User profiles and role information |
| `missions` | Publicly readable programmes/missions; manager-managed |
| `applications` | Volunteer applications, owned by the `uid` field |
| `news_articles` | News articles |
| `mail` | Contact enquiries / mail records |
| `donations`, `pledges`, `notifications` | Shared platform collections; Android support depends on implemented features |

Firestore rules are maintained in `mobile-app/firestore.rules`. Committing this file does not deploy it. The rules must be reviewed and published in the correct Firebase project's Firestore Rules console.

The website and Android client must use the same Firebase project and agree on collection names, field names and authorization rules. In particular, the website's supplied rules must be reconciled with Android's public contact-message submission before deployment.

## Getting started

### Requirements

- Android Studio
- JDK 17
- Android SDK required by the Gradle configuration
- Access to the PHOENIX ORG Firebase project

### Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/TEBOG0-M/PHOENIX-ORG.git
   ```

2. Open `mobile-app/` in Android Studio.
3. Place the Firebase Android configuration file at `mobile-app/app/google-services.json`.
4. Sync Gradle.
5. Run the application on an emulator or Android device.

Do not commit service-account keys, private signing keys, passwords or other server credentials. Firebase client configuration is not a substitute for Firestore security rules.

## Build and test

From `mobile-app/`:

**Windows**
```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
```

**macOS / Linux**
```bash
./gradlew assembleDebug
./gradlew testDebugUnitTest
```

The GitHub Actions workflow at `.github/workflows/android-ci.yml` runs the Android debug build and JVM unit tests on pushes and pull requests affecting the Android project or workflow. A successful run uploads a debug APK artifact.

View runs under the repository's **Actions** tab.

## Repository structure

```
PHOENIX-ORG/
├── .github/
│   └── workflows/
│       └── android-ci.yml
├── mobile-app/
│   ├── app/
│   ├── firestore.rules
│   └── README.md
├── website/                 # Separate website project
├── api/                     # Existing PHP/MySQL project assets
├── azure-pipelines.yml
└── README.md
```

## Security and deployment notes

- Public registration must never grant manager privileges.
- User-owned records must be scoped to the authenticated Firebase UID.
- Manager access must be enforced by Firestore rules, not only by Android navigation.
- Review and deploy Firestore rules in the intended Firebase project.
- Verify Firebase Authentication, profile creation, role assignment and each Firestore operation against the deployed project.
- Do not claim a feature or integration is operational until it has been tested.

## Project status

This repository is an active project. The Android source and CI configuration are maintained here. Build status, Firebase deployment, live data availability and runtime behaviour must be verified from the corresponding GitHub Actions run and Firebase project; source code alone does not prove deployment or runtime success.

## Repository

[PHOENIX ORG on GitHub](https://github.com/TEBOG0-M/PHOENIX-ORG)
