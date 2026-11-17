# PHOENIX ORG — Android

The Android application provides mobile access to PHOENIX ORG information, missions/programmes, news, volunteer applications and contact enquiries.

## Technology

| Technology | Responsibility |
|---|---|
| Kotlin | Application language |
| Jetpack Compose | UI |
| Material 3 | UI components |
| Navigation Compose | Screen navigation |
| Firebase Authentication | Email/password authentication |
| Cloud Firestore | Profile and application data |
| Coroutines and Flow | Asynchronous operations and observable state |
| AndroidX Lifecycle | ViewModel and lifecycle integration |
| DataStore Preferences | Local preferences |

The Android namespace and application ID are `com.mamelodiinitiative`. Do not change them without updating the registered Firebase Android app and its configuration.

## Implemented application areas

- Account registration and sign-in.
- Authenticated user profile loading.
- Public home, information, mission/programme and news screens.
- Volunteer application submission and application-status retrieval.
- Manager dashboard and application review.
- Manager mission/programme creation, editing and deletion.
- Contact enquiry submission.
- Role-aware navigation and account settings.

The manager interface is not a complete organisation-management console. A visible menu item does not guarantee that a corresponding database-management feature exists. In particular, a registered-volunteer directory and full user-profile administration are not currently implemented.

Donation screens are informational unless a separate payment integration is configured. Do not describe a form submission or pledge as a completed payment.

## Requirements

- Android Studio
- JDK 17
- Android SDK compatible with the Gradle configuration
- Access to the PHOENIX ORG Firebase project

## Configure and run

1. Clone the repository:
   ```bash
   git clone https://github.com/TEBOG0-M/PHOENIX-ORG.git
   ```
2. Open the `mobile-app/` directory in Android Studio.
3. Configure the Firebase Android application file at:
   ```text
   app/google-services.json
   ```
4. Confirm that the Firebase configuration matches application ID `com.mamelodiinitiative`.
5. Enable Email/Password authentication in Firebase Authentication.
6. Sync Gradle and run the application.

Never add Firebase Admin service-account credentials, private keys, passwords or signing secrets to the Android project.

## Build and test

Run from this directory.

**Windows**
```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
```

**macOS/Linux**
```bash
./gradlew assembleDebug
./gradlew testDebugUnitTest
```

The debug APK is generated at:
```text
app/build/outputs/apk/debug/app-debug.apk
```

GitHub Actions is configured in the repository at `.github/workflows/android-ci.yml`. Azure Pipelines is configured at `azure-pipelines.yml` within this directory. Check the relevant pipeline run for its actual result.

## Firestore contract

| Collection | Purpose |
|---|---|
| `users/{uid}` | User profile; document ID matches Firebase Authentication UID |
| `missions/{missionId}` | Mission/programme content |
| `applications/{applicationId}` | Volunteer applications; ownership field is `uid` |
| `news_articles/{articleId}` | News content |
| `mail/{messageId}` | Contact enquiries |

The shared platform uses role values such as `member`, `volunteer`, `donor` and the privileged `manager` role. Public registration must never grant manager privileges.

The rules source is [`firestore.rules`](firestore.rules). It is a source file only; it must be reviewed and deployed to the correct Firebase project. Rules for the website and Android client must be reconciled before publishing shared changes.

## Project structure

```text
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
├── docs/
├── firestore.rules
├── azure-pipelines.yml
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

## Security and verification

- Firestore rules are the authoritative data-access boundary.
- A client-side role check is not sufficient authorization.
- User-owned records must be scoped to the authenticated UID.
- Do not silently replace failed database reads with sample data in production-facing flows.
- Verify manager operations against the deployed rules and real Firebase records.
- A successful build does not prove authentication, database permissions or every screen works at runtime.

## Related resources

- [Repository](https://github.com/TEBOG0-M/PHOENIX-ORG)
- [Android CI](https://github.com/TEBOG0-M/PHOENIX-ORG/actions)
