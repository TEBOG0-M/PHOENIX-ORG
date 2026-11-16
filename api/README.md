# Legacy PHP API

This directory contains a separate PHP REST API and MySQL schema retained in the repository. It is not the active data layer for the Android application, which uses Firebase Authentication and Cloud Firestore.

## Requirements

- PHP 8.1 or later
- Composer
- MySQL 8 or a compatible MySQL server
- PHP extensions: PDO, PDO MySQL and mbstring
- A web server configured to route API requests to `public/index.php`

## Install dependencies

From this directory:

```bash
composer install
```

## Database setup

Create the database and tables using:

```bash
mysql -u <database-user> -p < database/schema.sql
```

The schema includes clearly labelled simulated sample records for development and academic demonstration. Do not treat sample users, applications, news or contact messages as real organisational data.

## Runtime configuration

Configure the following environment variables in the PHP hosting environment:

| Variable | Purpose |
|---|---|
| `API_PREFIX` | URL prefix stripped before route matching; defaults to `/api` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed browser origins |
| `DB_HOST` | MySQL hostname; defaults to `127.0.0.1` |
| `DB_PORT` | MySQL port; defaults to `3306` |
| `DB_NAME` | Database name; defaults to `mamelodi` |
| `DB_USER` | Database username |
| `DB_PASS` | Database password |
| `DB_SSL_CA` | Optional path to the database TLS CA certificate |
| `FIREBASE_PROJECT_ID` | Firebase project ID used to validate Firebase ID tokens |

Do not commit production credentials or environment files.

## Available routes

The API prefix is configurable through `API_PREFIX`.

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| GET | `/news` | Public | List news articles |
| GET | `/news/{id}` | Public | Read a news article |
| POST | `/contact` | Public | Submit a contact message |
| GET | `/me` | Firebase ID token | Read/upsert the authenticated profile |
| GET | `/volunteer-applications` | Firebase ID token | List the caller's applications |
| POST | `/volunteer-applications` | Firebase ID token | Submit an application |
| GET | `/volunteer-applications/{id}` | Firebase ID token | Read one of the caller's applications |
| DELETE | `/volunteer-applications/{id}` | Firebase ID token | Withdraw one of the caller's applications |

Authenticated routes require an `Authorization: Bearer <Firebase ID token>` header. Application queries are scoped to the authenticated Firebase UID.

## Tests

Install dependencies, then run:

```bash
composer test
```

The current PHPUnit suite covers validation and Firebase token-claim logic. It does not replace integration testing against a configured MySQL database, Firebase project or deployed web server.

## Important boundaries

- This API uses MySQL tables and is separate from the Android Firestore repositories.
- The API schema and Firestore schema are not automatically synchronized.
- Do not assume an Android feature uses this API unless the Android source explicitly calls it.
- The API has no production deployment status implied by its presence in this repository.
