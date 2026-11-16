# PHOENIX ORG

PHOENIX ORG is a digital platform concept supporting education, mentorship and youth development. This repository contains the Android application, a separate website project and supporting materials.

## Repository components

| Component | Location | Purpose |
|---|---|---|
| Android application | [`mobile-app/`](mobile-app/) | Kotlin, Jetpack Compose, Firebase Authentication and Cloud Firestore |
| Android GitHub Actions | [`.github/workflows/android-ci.yml`](.github/workflows/android-ci.yml) | Android debug build, JVM unit tests and APK artifact |
| Android Azure Pipeline | [`mobile-app/azure-pipelines.yml`](mobile-app/azure-pipelines.yml) | Alternative Android CI pipeline |
| Website | [`phoenox-website/`](phoenox-website/) | Separate static website project with its own Firebase integration |
| Legacy API assets | [`api/`](api/) | Existing PHP API and relational database materials; not the Android app's active data layer |
| Project plan | [`Project Plan.docx`](Project%20Plan.docx) | Original project planning document |

The Android application and website are separate clients. Do not assume that a feature, data operation or security rule implemented for one client is automatically available to the other.

## Android application

The Android app provides organisational information, mission/programme listings, news, volunteer application flows and contact enquiries. It uses:

- Kotlin
- Jetpack Compose and Material 3
- Navigation Compose
- Firebase Authentication
- Cloud Firestore
- Kotlin Coroutines and Flow
- AndroidX Lifecycle
- DataStore Preferences

The Android namespace and application ID remain `com.mamelodiinitiative` to match the registered Firebase Android application.

### Android setup

**Requirements**
- Android Studio
- JDK 17
- Android SDK versions required by the Gradle configuration
- Access to the PHOENIX ORG Firebase project

**Steps**
1. Clone the repository:
   ```bash
   git clone https://github.com/TEBOG0-M/PHOENIX-ORG.git
   ```
2. Open `mobile-app/` in Android Studio.
3. Ensure the Firebase Android configuration is available at `mobile-app/app/google-services.json`.
4. Sync the Gradle project.
5. Build and run the app on an emulator or physical Android device.

### Build and test

Run commands from `mobile-app/`.

Windows:
```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
```

macOS/Linux:
```bash
./gradlew assembleDebug
./gradlew testDebugUnitTest
```

GitHub Actions runs the Android debug build and JVM unit tests for relevant changes to the Android project. Successful runs publish a debug APK artifact. Check the Actions tab for the actual result; the presence of a workflow file does not prove that a run passed.

## Firebase and data boundaries

The Android client uses these Firestore collection conventions:

| Collection | Android purpose |
|---|---|
| `users/{uid}` | User profile and role |
| `missions/{missionId}` | Mission/programme content |
| `applications/{applicationId}` | Volunteer applications; owner field is `uid` |
| `news_articles/{articleId}` | News content |
| `mail/{messageId}` | Contact enquiries |

The repository also contains references to shared collections such as `donations`, `pledges` and `notifications`; their presence in Firestore rules does not mean the Android client has a complete management feature for them.

Android Firestore rules are maintained in [`mobile-app/firestore.rules`](mobile-app/firestore.rules). They must be reviewed and deployed to the intended Firebase project separately. A Git commit does not publish Firestore rules.

Public registration must not grant privileged roles. Manager access must be assigned through an authorized administrative process and enforced by Firestore security rules, not only by Android navigation.

The website has its own setup and integration notes in [`phoenox-website/README.md`](phoenox-website/README.md). Confirm collection names, field names and authorization behavior with the website maintainer before changing shared Firebase rules.

## Repository layout

```text
PHOENIX-ORG/
├── .github/
│   └── workflows/
│       └── android-ci.yml
├── api/                         # Existing PHP/API and SQL materials
├── mobile-app/                  # Android application
│   ├── app/
│   ├── docs/
│   ├── firestore.rules
│   ├── azure-pipelines.yml
│   └── README.md
├── phoenox-website/             # Separate website project
├── Project Plan.docx
├── LICENSE
└── README.md
```

## Security and maintenance

- Never commit passwords, service-account credentials, private signing keys or access tokens.
- Treat Firebase client configuration as public client configuration, not as a security boundary; protect data with Firestore rules.
- Keep personal and environment-specific files out of version control.
- Verify the active Firebase project before deploying rules or testing privileged operations.
- Report runtime behavior only after testing it on a configured device or emulator.
- Keep documentation aligned with the code and workflows that actually exist.

## Project status

This repository contains source code and delivery configuration. Runtime feature coverage, deployed Firebase rules, live data availability and successful pipeline execution must each be verified independently.

## Links

- [GitHub repository](https://github.com/TEBOG0-M/PHOENIX-ORG)
- [Android CI runs](https://github.com/TEBOG0-M/PHOENIX-ORG/actions)
