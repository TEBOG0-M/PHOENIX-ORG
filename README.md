PHOENIX ORG

A digital platform for education, mentorship and youth development.

PHOENIX ORG is a community-focused initiative supporting young people through educational programmes, mentorship and opportunities for personal development.

This repository contains the organisation's digital platform, bringing together a public-facing website, an Android application and a backend API.

---

Project Components

Component| Directory| Technology
Website| ""website/"" (website/)| HTML, CSS, JavaScript
Android Application| ""mobile-app/"" (mobile-app/)| Kotlin, Jetpack Compose
Backend API| ""api/"" (api/)| PHP
Database| ""api/database/"" (api/database/)| MySQL
CI/CD| ""azure-pipelines.yml"" (azure-pipelines.yml)| Azure Pipelines

---

Contents

- "About the Project" (#about-the-project)
- "Platform Features" (#platform-features)
- "System Architecture" (#system-architecture)
- "Repository Structure" (#repository-structure)
- "Technology Stack" (#technology-stack)
- "Getting Started" (#getting-started)
- "Backend API" (#backend-api)
- "Database" (#database)
- "Testing and Continuous Integration" (#testing-and-continuous-integration)
- "Security" (#security)
- "Development Guidelines" (#development-guidelines)
- "Project Status" (#project-status)

---

About the Project

The PHOENIX ORG platform is intended to make organisational information and opportunities more accessible to learners, volunteers and supporters.

The system is organised into three main application components:

1. Website: Provides public access to organisational information, programmes, news and contact details.
2. Android application: Provides a dedicated mobile experience for accessing organisational services.
3. Backend API: Provides server-side functionality and database operations for supported application features.

The platform is designed to evolve around a shared backend and database architecture.

Platform Features

Organisation and Programmes

- Organisational information and mission.
- Educational programme listings.
- Individual programme information.
- Access to organisational updates.

Volunteer Engagement

- Volunteer information.
- Application forms.
- Application submission and validation.
- Application review and status management through backend services.

News and Communication

- News article listings.
- Individual article pages.
- Contact information.
- Contact enquiry submission.

Donations

- Donation information and ways to support the organisation.
- Official donation instructions.

The current platform does not include payment processing.

---

System Architecture

The repository contains separate website and Android clients, alongside a PHP API and MySQL database.

High-Level Architecture

                PHOENIX ORG PLATFORM
                         |
              +----------+----------+
              |                     |
              v                     v
           Website             Android App
              |                     |
              +----------+----------+
                         |
                         v
                    Backend API
                      (PHP)
                         |
              +----------+----------+
              |                     |
              v                     v
           MySQL              Firebase Auth
           Database           Token Verification

Firebase Authentication provides user identity for protected API operations. The PHP API verifies Firebase ID tokens before processing authenticated requests.

Current Integration Consideration

The Android application contains Firebase Authentication and Firestore dependencies. The PHP backend uses MySQL for its persistent records.

The intended architecture is to align website and Android data access through the same backend and database.

The repository should not be considered fully unified until the existing mobile data flows have been verified and connected to the intended shared backend.

---

Repository Structure

PHOENIX-ORG/
│
├── website/
│   ├── assets/
│   ├── pages/
│   └── index.html
│
├── mobile-app/
│   ├── app/
│   ├── build.gradle.kts
│   └── README.md
│
├── api/
│   ├── database/
│   │   └── schema.sql
│   ├── public/
│   │   └── index.php
│   ├── src/
│   │   └── lib.php
│   ├── composer.json
│   └── tests/
│
├── tools/
│   └── check-site.mjs
│
├── azure-pipelines.yml
└── README.md

---

Technology Stack

Website

- HTML5
- CSS3
- JavaScript

Android Application

- Kotlin
- Android Studio
- Jetpack Compose
- Material 3
- Firebase Authentication
- Cloud Firestore dependencies
- Retrofit
- OkHttp
- Kotlin Coroutines

Backend

- PHP 8.1+
- MySQL
- PDO
- Firebase ID-token verification
- Composer
- PHPUnit

Development and Automation

- Git
- GitHub
- Azure DevOps
- Azure Pipelines

---

Getting Started

Prerequisites

Component| Requirement
Website| Modern web browser
Android| Android Studio and JDK 17
Backend| PHP 8.1+
Database| MySQL
Dependencies| Composer
Version control| Git

Clone the Repository

git clone https://github.com/TEBOG0-M/PHOENIX-ORG.git

cd PHOENIX-ORG

Website Setup

The website uses standard HTML, CSS and JavaScript. No frontend build step is currently required.

Open:

website/index.html

in a browser or use a local development server.

<details>
<summary><strong>Website implementation notes</strong></summary>The current website includes:

- Responsive shared header and navigation.
- Home page.
- Mission and organisational information.
- Programme listings and programme detail pages.
- News listing and sample article pages.
- Volunteer, contact and donation-interest forms.
- Login, registration, password reset and account interface pages.

Important: The website's current forms display notices rather than sending real submissions. Firebase Authentication is not configured in the current website copy, so its authentication interface is not yet operational.

Before publication:

- Replace sample news with verified organisational content.
- Confirm programme details.
- Add official contact details.
- Confirm official donation instructions.
- Review and approve the privacy notice.
- Connect and test the required backend and authentication functionality.

</details>Android Application Setup

Open the "mobile-app/" directory in Android Studio.

Configure the existing Firebase Android application and add the corresponding "google-services.json" file:

mobile-app/app/google-services.json

Sync Gradle, select an emulator or connected device, and run the application.

For detailed instructions, see the "Android Application README" (mobile-app/README.md).

Backend Setup

The backend requires PHP 8.1 or later, Composer, MySQL and the PHP PDO MySQL extension.

Install the dependencies:

cd api
composer install

Configure the required environment variables in the PHP hosting environment.

Variable| Description
"DB_HOST"| MySQL hostname
"DB_PORT"| MySQL port
"DB_NAME"| Database name
"DB_USER"| Database username
"DB_PASS"| Database password
"DB_SSL_CA"| Optional MySQL SSL CA certificate
"FIREBASE_PROJECT_ID"| Firebase project identifier
"ALLOWED_ORIGINS"| Allowed website origins
"API_PREFIX"| API URL prefix; defaults to "/api"

Do not commit environment files containing credentials.

---

Backend API

The API entry point is:

api/public/index.php

The API provides JSON-based endpoints for public information, contact submissions and authenticated user operations.

Available Endpoints

Method| Endpoint| Authentication| Description
GET| "/api/health"| No| Health check
GET| "/api/news"| No| List news articles
GET| "/api/news/{id}"| No| Retrieve an article
POST| "/api/contact"| No| Submit contact enquiry
GET| "/api/me"| Firebase token| Retrieve user profile
POST| "/api/volunteer-applications"| Firebase token| Submit application
GET| "/api/volunteer-applications"| Firebase token| List user's applications
GET| "/api/volunteer-applications/{id}"| Firebase token| Retrieve application
DELETE| "/api/volunteer-applications/{id}"| Firebase token| Withdraw application

Authentication

Protected endpoints require a bearer token:

Authorization: Bearer FIREBASE_ID_TOKEN

The backend verifies the Firebase ID token and checks its project identity before allowing access to protected operations.

API Response Format

Successful responses and errors are returned as JSON.

Example health response:

{
  "status": "ok"
}

Example validation error:

{
  "error": "Please correct the highlighted fields.",
  "fields": {
    "email": "Enter a valid email address."
  }
}

---

Database

The database schema is maintained at:

""api/database/schema.sql"" (api/database/schema.sql)

Database Tables

Table| Responsibility
"user_profiles"| Stores authenticated user profiles
"volunteer_applications"| Stores volunteer applications
"news_articles"| Stores organisational news
"contact_messages"| Stores contact enquiries

Sample Data

The supplied SQL schema includes sample records for demonstration and testing.

Sample records are identified using the "is_sample" field. They should not be confused with genuine organisational or user data.

To initialise the database, run the schema against a MySQL instance:

mysql -u YOUR_DB_USER -p < api/database/schema.sql

---

Testing and Continuous Integration

Backend Tests

The backend uses PHPUnit.

Run the test suite:

cd api
composer test

Website Validation

The repository includes a website validation script:

node tools/check-site.mjs

Android Build

From the Android project directory:

cd mobile-app
./gradlew assembleDebug
./gradlew testDebugUnitTest

Azure Pipelines

The pipeline configuration is maintained in:

""azure-pipelines.yml"" (azure-pipelines.yml)

It currently defines three jobs:

Job| Purpose
Website| Checks website pages and links
API| Installs Composer dependencies and runs PHPUnit
Android| Builds a debug APK and runs JVM unit tests

The Android pipeline job currently uses "continueOnError: true". This means Android failures may not fail the overall pipeline. It should be reviewed before using the pipeline as a strict release gate.

---

Security

Security requirements apply across all components:

- Never commit database credentials, private keys or server secrets.
- Verify Firebase ID tokens on protected backend endpoints.
- Use HTTPS in production.
- Validate incoming data on the server.
- Use prepared statements for database operations.
- Enforce user ownership checks when retrieving or modifying application records.
- Restrict cross-origin requests to approved origins.
- Avoid exposing sensitive user information in API responses or application logs.

---

Development Guidelines

Contributions should preserve the existing project structure and established integration contracts.

When implementing changes:

1. Keep website, mobile and backend behaviour consistent.
2. Avoid unnecessary changes to package names, database identifiers and API routes.
3. Validate new functionality against its actual backend behaviour.
4. Handle loading, success and error states appropriately.
5. Run relevant build and validation commands before considering work complete.
6. Use clear and descriptive commit messages.
7. Update documentation when project functionality or setup requirements change.

---

Project Status

PHOENIX ORG is an actively developed project.

The repository currently contains:

- A public-facing website.
- An Android application.
- A PHP REST API.
- A MySQL database schema.
- Automated validation and build configuration.

Website authentication and form submission still require implementation. The mobile application's data integration with the PHP/MySQL backend also requires verification and alignment.

The project should be considered under development until these integration and production-readiness requirements have been completed and tested.

---

Documentation

Document| Purpose
"Main README" (README.md)| Complete project overview
"Android README" (mobile-app/README.md)| Android setup, architecture and development
"Database Schema" (api/database/schema.sql)| Database definitions and sample data
"Azure Pipeline" (azure-pipelines.yml)| CI configuration

---

Repository

"github.com/TEBOG0-M/PHOENIX-ORG" (https://github.com/TEBOG0-M/PHOENIX-ORG)

PHOENIX ORG
Education. Mentorship. Opportunity.
