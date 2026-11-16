PHOENIX ORG — Android Application

The PHOENIX ORG Android application provides a mobile platform for community members to explore programmes, access organisational information, follow news and submit volunteer applications.

The application is developed with Kotlin and Jetpack Compose, following modern Android development practices.

Features

Authentication

- User registration and sign-in using Firebase Authentication.
- Authentication state management through an application-level authentication gate.
- Sign-out functionality.

Home and Organisation

- Home screen with organisational information.
- About section describing the organisation.
- Programme listings and individual programme details.

Volunteer Applications

- Volunteer information and application entry point.
- Multi-step application process.
- Application review before submission.
- Submission success screen.
- Form state managed through a shared ViewModel.

News

- News listing.
- Individual news article details.

Additional Information

- Donation information.
- Contact information.
- Additional organisational navigation.

«Note: The application provides donation information; it does not currently represent a payment-processing integration.»

Technology Stack

Technology| Purpose
Kotlin| Application programming language
Jetpack Compose| Declarative UI
Material 3| UI components and theming
Android Navigation Compose| Screen navigation
Firebase Authentication| User authentication
Cloud Firestore| Existing cloud data integration
Retrofit| HTTP API communication
Gson| JSON serialization
OkHttp| HTTP client and logging
DataStore Preferences| Local preference storage
Kotlin Coroutines| Asynchronous operations
AndroidX Lifecycle| Lifecycle-aware state management

Project Structure

mobile-app/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/mamelodiinitiative/
│   │       │       ├── auth/
│   │       │       ├── navigation/
│   │       │       ├── ui/
│   │       │       │   ├── components/
│   │       │       │   ├── screens/
│   │       │       │   └── theme/
│   │       │       ├── viewmodel/
│   │       │       └── MainActivity.kt
│   │       └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
└── README.md

The package and namespace currently remain "com.mamelodiinitiative". The PHOENIX ORG rebrand does not require changing these technical identifiers.

Requirements

- Android Studio.
- JDK 17.
- Android SDK 35.
- Android device or emulator running Android 7.0 (API 24) or later.
- Access to the project's configured Firebase project.

Getting Started

1. Clone the repository:
   
   git clone https://github.com/TEBOG0-M/PHOENIX-ORG.git

2. Open the "mobile-app" directory in Android Studio.

3. Configure the Firebase Android application and place the corresponding "google-services.json" file inside:
   
   mobile-app/app/google-services.json

4. Sync the project with Gradle.

5. Select an Android emulator or connected device.

6. Build and run the application from Android Studio.

The configured Android build targets SDK 35, uses a minimum SDK of 24 and targets Java 17.

Backend Integration

The repository also contains a PHP REST API and MySQL database schema under "api/".

The API provides endpoints for:

- Health checks.
- News retrieval.
- Contact submissions.
- Authenticated user profiles.
- Volunteer application submission, retrieval and withdrawal.

Authenticated API requests use Firebase ID tokens, which the PHP backend verifies before processing protected operations.

Database integration status: The Android application has existing Firebase/Firestore integration, while the PHP API persists its records in MySQL. These are separate data stores in the current implementation. A unified MySQL-backed data flow is an integration requirement, not something this README claims is already complete.

The intended architecture should use the same backend and database for the website and mobile application, with Firebase Authentication providing user identity where applicable.

Build and Testing

The Android project is configured for:

- Debug APK builds.
- Local JVM unit tests.
- Android instrumentation tests.

When the Gradle wrapper is available in the project, the following commands can be used from "mobile-app":

./gradlew assembleDebug
./gradlew testDebugUnitTest

On Windows:

.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest

Build and test results should be verified against the current project before being treated as passing.

Security

- Do not commit private credentials or signing keys.
- Keep Firebase configuration specific to the intended application.
- Do not embed database credentials in the Android application.
- Use HTTPS for production API communication.
- Send Firebase ID tokens through authenticated API requests.
- Validate user input on both the client and server.

Development Notes

The Android application is part of the wider PHOENIX ORG project. Its development should remain aligned with the shared backend, database and organisational requirements.

Existing package names, Firebase identifiers and backend contracts should only be changed when a confirmed technical requirement calls for it.

Project Repository

"PHOENIX ORG — GitHub Repository" (https://github.com/TEBOG0-M/PHOENIX-ORG)
