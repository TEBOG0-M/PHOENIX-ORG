# Android delivery architecture

This document describes the Android delivery configuration in this repository. GitHub is the current source repository. Azure Pipelines is retained as an additional pipeline configuration.

## Source control

- **GitHub repository:** `TEBOG0-M/PHOENIX-ORG`
- **Primary branch:** `main`
- Keep commits focused and use descriptive commit messages.
- Use short-lived feature or maintenance branches for changes that need review.
- Do not commit generated build output, local IDE state, credentials or machine-specific configuration.

## Continuous integration

### GitHub Actions

Workflow: `.github/workflows/android-ci.yml`

The workflow is configured to:
1. Check out the repository.
2. Set up JDK 17.
3. Configure Gradle.
4. Run `assembleDebug` and `testDebugUnitTest`.
5. Upload the debug APK and unit-test reports when available.

### Azure Pipelines

Configuration: `mobile-app/azure-pipelines.yml`

The pipeline runs the Android build and JVM unit tests and publishes build/test artifacts. It requires an Azure DevOps pipeline to be created and authorized against this repository.

A YAML file is configuration, not evidence of a successful pipeline. Verify the actual run and artifact before reporting delivery success.

## Android architecture

- **Presentation:** Jetpack Compose screens and navigation.
- **State:** ViewModels expose UI state using Kotlin Flow.
- **Data access:** repository classes encapsulate Firebase operations.
- **Authentication:** Firebase Authentication.
- **Database:** Cloud Firestore.
- **Authorization:** Firestore security rules; client-side route guards are supplementary.

## Firebase operations

The Android Firestore rules source is `mobile-app/firestore.rules`. Review the rules against the shared website data contract before deployment. Deploying rules is a separate Firebase Console or Firebase CLI operation and is not performed by the Android build pipeline.

Do not store manager credentials or Firebase Admin service-account keys in the repository. Assign privileged roles through an authorized administrative process.

## Release verification

Before treating a build as a release candidate:

1. Confirm the commit SHA.
2. Confirm the correct Firebase Android configuration is used.
3. Run the build and unit tests.
4. Install the resulting APK on a physical device.
5. Verify authentication and the main user journeys.
6. Verify manager operations against deployed Firestore rules.
7. Capture genuine test evidence and record known limitations.

Build success alone does not establish that Firebase configuration, deployed rules, data or runtime flows are correct.
