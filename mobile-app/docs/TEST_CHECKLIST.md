# Android verification checklist

Use this checklist when validating a build against the configured Firebase project. Mark an item complete only after performing the check on an emulator or physical device.

## Build and delivery

- [ ] Gradle sync completes.
- [ ] `assembleDebug` succeeds.
- [ ] `testDebugUnitTest` succeeds.
- [ ] GitHub Actions run completes successfully.
- [ ] APK installs and launches on a physical Android device.

## Authentication and profiles

- [ ] Email/Password provider is enabled in the intended Firebase project.
- [ ] A new account can register.
- [ ] The account appears in Firebase Authentication.
- [ ] A matching `users/{uid}` profile is created.
- [ ] Existing accounts can sign in.
- [ ] Invalid credentials show a useful error.
- [ ] Profile loading handles the stored Firestore field types.
- [ ] Existing privileged roles are preserved.
- [ ] Session persists after closing and reopening the app.
- [ ] Sign-out returns the user to the unauthenticated flow.

## Public application flows

- [ ] Home and information screens load.
- [ ] Mission/programme list and detail screens load real Firestore data.
- [ ] News list and detail screens load the expected records.
- [ ] Volunteer application validation works.
- [ ] A volunteer can submit an application.
- [ ] A volunteer can view their own application status.
- [ ] Contact enquiry submission succeeds and reports failures clearly.

## Manager flows

- [ ] A manager account loads with role `manager`.
- [ ] Manager-only navigation is displayed to the manager.
- [ ] The manager dashboard loads application and mission data.
- [ ] Applications are visible to the manager.
- [ ] Approve and reject actions persist to Firestore.
- [ ] Mission creation persists to Firestore.
- [ ] Mission editing updates the intended document.
- [ ] Mission deletion removes the intended document.
- [ ] Permission failures are shown clearly rather than hidden by sample data.

## Firebase security and integration

- [ ] The app is connected to the intended Firebase project.
- [ ] Firestore rules are deployed to that project.
- [ ] Volunteer accounts cannot read another volunteer's private records.
- [ ] Public users cannot assign themselves privileged roles.
- [ ] Manager operations are authorized by Firestore rules.
- [ ] Website and Android collection/field conventions are reconciled.
- [ ] No service-account key, private key or password is committed.

## Evidence

- [ ] Record the commit SHA used for the tested build.
- [ ] Record the GitHub Actions run URL and result.
- [ ] Capture genuine screenshots or a screen recording of the tested flows.
- [ ] Record any known limitations; do not present untested features as complete.
