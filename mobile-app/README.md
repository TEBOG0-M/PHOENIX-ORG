# PHOENIX ORG — Android Application

The PHOENIX ORG Android application provides mobile access to organisational information, missions/programmes, news, volunteer applications and contact enquiries.

Built with Kotlin and Jetpack Compose, the application uses Firebase Authentication and Cloud Firestore for its Android identity and data layer.

## Features

- Email/password registration and sign-in using Firebase Authentication.
- Authenticated session and Firestore profile handling.
- Public organisational information and mission/programme listings.
- Programme detail and manager programme-management flows.
- News listing and article details.
- Volunteer application submission and status retrieval.
- Manager application review, subject to the user's Firestore role.
- Contact enquiry submission.
- Role-aware navigation and account settings.
- Loading, empty and error states where implemented.

Donation screens provide information only unless a real payment integration is separately configured. The app must not represent an intention or form submission as a completed payment.

## Technology

| Technology | Purpose |
|---|---|
| Kotlin | Application language |
| Jetpack Compose | UI framework |
| Material 3 | UI components |
| Navigation Compose | App navigation |
| Firebase Authentication | User authentication |
| Cloud Firestore | Application data |
| Kotlin Coroutines / Flow | Asynchronous work and state |
| AndroidX Lifecycle | Lifecycle-aware state |
| DataStore Preferences | Local preferences, where used |

The namespace and application ID remain `com.mamelodiinitiative` for compatibility with the configured Firebase Android application.

## Firestore contract

The Android data layer uses these shared collection names:

| Collection | Purpose |
|---|---|
| `users/{uid}` | User profile; document ID is the Firebase Authentication UID |
| `missions/{missionId}` | Public mission/programme content |
| `applications/{applicationId}` | Volunteer applications; owner field is `uid` |
| `news_articles/{articleId}` | Public news content |
| `mail/{messageId}` | Contact enquiry submission |
| `donations`, `pledges`, `notifications` | Shared platform collections; use only where a corresponding Android feature is implemented |

The role values used by the shared platform include `member`, `volunteer`, `donor` and the privileged `manager` role. Public registration must never grant manager access. Manager privileges must be assigned through an authorized administrative process.

The Firestore rules source is `firestore.rules`. It must be deployed to the same Firebase project used by the Android app. A successful source-code build does not confirm that rules are deployed or that runtime access is authorized.

**Integration note:** The website's supplied rules currently differ on who may create `mail` documents. Android contact submission requires a narrowly validated public create permission. Reconcile this rule with the website developer before deploying shared rules.

## Requirements

- Android Studio
- JDK 17
- Android SDK matching the Gradle configuration
- Access to the PHOENIX ORG Firebase project
- Android emulator or physical Android device

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/TEBOG0-M/PHOENIX-ORG.git
   ```

2. Open the `mobile-app` directory in Android Studio.
3. Add the Firebase Android configuration file:

   ```
   mobile-app/app/google-services.json
   ```

4. Sync Gradle.
5. Run the application on a configured emulator or device.

Never place manager passwords, service-account credentials or private keys in source code, configuration committed to Git, or application defaults.

## Build and test

Run from the `mobile-app` directory.

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

GitHub Actions runs the debug build and JVM unit tests through `.github/workflows/android-ci.yml`. Successful runs upload a debug APK artifact. Check the repository's **Actions** tab for the actual run result.

## Project structure

```
mobile-app/
├── app/
│   └── src/main/
│       ├── java/com/mamelodiinitiative/
│       │   ├── auth/
│       │   ├── data/
│       │   ├── navigation/
│       │   ├── ui/
│       │   └── viewmodel/
│       └── AndroidManifest.xml
├── firestore.rules
├── build.gradle.kts
└── README.md
```

## Security

- Firestore rules are the authoritative data-access boundary.
- User profile document IDs must match Firebase Authentication UIDs.
- Volunteers may access only their own private records.
- Manager operations must be authorized by Firestore rules.
- Never trust a client-side role check as the only access control.
- Validate data before writing it to Firestore.
- Keep passwords and privileged credentials out of the repository.
- Confirm the active Firebase project and deployed rules when investigating permission errors.

## Related resources

- [PHOENIX ORG repository](https://github.com/TEBOG0-M/PHOENIX-ORG)
- [GitHub Actions](https://github.com/TEBOG0-M/PHOENIX-ORG/actions)
