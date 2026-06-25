<!-- Copyright (c) 2026 Chinaready. All rights reserved. -->

# Provisioning the field-reports demo

One-time setup before running the probes. Steps marked **console** are manual
(Firebase Console); the rest are scripted. Run scripted steps from `firebase-demo/`
with the repo-root `.env` populated and `npm install` done.

## 0. Prerequisites

- A Firebase project (note the project ID).
- A **service account JSON** (Project settings → Service accounts → Generate new key),
  saved to the path in `GOOGLE_APPLICATION_CREDENTIALS`.
- The Web app config copied into `.env` (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, …).
- `firebase-tools` for deploys: `npm i -g firebase-tools && firebase login`.
- **Blaze (pay-as-you-go) billing** enabled — required for Cloud Functions. If billing
  is off, skip step 4 and the Functions probe falls back to transport-only.

## 1. Enable Auth providers (console)

Authentication → Sign-in method → enable **Email/Password** and **Anonymous**.

Create the demo user (matches `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` in `.env`):

```bash
node -e '
import("firebase-admin/app").then(async (app) => {
  const { getAuth } = await import("firebase-admin/auth");
  const { readFileSync } = await import("node:fs");
  const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
  app.initializeApp({ credential: app.cert(sa) });
  const u = await getAuth().createUser({
    email: process.env.DEMO_USER_EMAIL,
    password: process.env.DEMO_USER_PASSWORD,
  }).catch((e) => ({ error: e.message }));
  console.log(u.uid || u.error);
  process.exit(0);
});'
```

## 2. Firestore — rules + seed

```bash
firebase deploy --only firestore:rules --project "$FIREBASE_PROJECT_ID"   # uses setup/firestore.rules
node setup/seed-firestore.mjs
```

(Point `firebase.json` `firestore.rules` at `setup/firestore.rules`, or paste the
rules in the console Rules tab.)

## 3. Storage — sample object

```bash
node setup/seed-storage.mjs   # uploads probes/field-report-sample.jpg (public)
```

## 4. Cloud Functions — deploy (Blaze only)

```bash
cd setup/functions && npm install && cd ../..
firebase deploy --only functions:helloProbe,functions:stampReport --project "$FIREBASE_PROJECT_ID"
```

Note the deployed region into `FIREBASE_FUNCTIONS_REGION` (default `us-central1`).

## 5. Remote Config — china_banner

```bash
firebase remoteconfig:get --project "$FIREBASE_PROJECT_ID" > /tmp/rc-current.json
# Merge the china_banner parameter from setup/remote-config.json, then:
firebase deploy --only remoteconfig --project "$FIREBASE_PROJECT_ID"
```

## 6. FCM — server credentials

Cloud Messaging is enabled with the project. The backend probe uses the service
account (FCM v1 API). Optionally set `FCM_TEST_TOKEN` to exercise a real send;
an invalid token still returns a real API error that proves backend → FCM reachability.

## Done

Run the probes:

```bash
npm run probe:all
```
