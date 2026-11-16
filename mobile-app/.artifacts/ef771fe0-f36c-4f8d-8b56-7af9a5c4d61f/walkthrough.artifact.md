# PHOENIX ORG — Phase 3.1: Shared Firebase Integration & Application-Wide Completion Walkthrough

## Summary of Accomplishments

### 1. Adopted Shared Firestore Schema
- Aligned Android data collections with the website's shared schema:
  - `users` (User profiles with `uid` and role `member`, `volunteer`, `donor`, `manager`)
  - `missions` (Missions / programmes collection replacing `programmes`)
  - `applications` (Volunteer applications collection replacing `volunteer_applications`, using `uid` instead of `userId`)
  - `donations` (Donation intention collection)
  - `pledges` (Pledge intention collection)
  - `notifications` (User notifications collection)
  - `mail` (Contact messages collection replacing `contact_messages`)
  - `news_articles` (News articles collection)

### 2. Reconciled Firestore Security Rules (`firestore.rules`)
- Updated security rules to match the shared schema collections (`users`, `missions`, `applications`, `donations`, `pledges`, `notifications`, `mail`, `news_articles`).
- Enforced strict user ownership checks (`uid`), allowed role assignment during registration (`member`, `volunteer`, `donor`), and prevented self-promotion to `manager` or `admin`.

### 3. Updated Android Repositories & Models
- `ProgrammeRepository`: Updated to read, save, and delete from `missions`.
- `VolunteerRepository`: Updated to submit, query, and update applications in `applications` using `uid`.
- `ContactRepository`: Updated to submit contact messages to `mail` collection using `uid`.
- `VolunteerApplication` & `ContactMessage` models updated with `uid` field mapping.

### 4. Build & Test Verification
- **`:app:assembleDebug`**: `BUILD SUCCESSFUL`
- **`:app:testDebugUnitTest`**: `BUILD SUCCESSFUL`
