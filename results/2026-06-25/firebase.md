# Firebase mainland China probe — 2026-06-25

- Generated: 2026-06-25T04:43:43Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Authentication | frontend | Auth anonymous sign-up | 000 | 10.000997 | Blocked |
| Authentication | frontend | Auth email sign-in | 000 | 10.000625 | Blocked |
| Cloud Firestore | frontend | Firestore read (unauth) | 000 | 10.000876 | Blocked |
| Cloud Storage | frontend | Storage download | 000 | 10.001183 | Blocked |
| Cloud Functions | frontend | Functions helloProbe | 000 | 10.001259 | Blocked |
| Cloud Firestore | backend | Firestore write+read | timeout | 30.005368 | Blocked |
| Cloud Storage | backend | Storage metadata | ETIMEDOUT | 3.670435 | Blocked |
| Authentication | backend | Auth admin lookup | auth-token-blocked | 1.377583 | Blocked |
| Cloud Messaging (FCM) | backend | FCM v1 send (dry-run) | auth-token-blocked | 1.35991 | Blocked |
| Remote Config | backend | Remote Config template | auth-token-blocked | 1.35936 | Blocked |
| Firebase ML / Vision | transport | Cloud Vision API | 000 | 10.001270 | Blocked |
| Firebase AI Logic | transport | Gemini / AI Logic | 000 | 10.000526 | Blocked |
| Google Analytics | transport | Firebase Analytics | 404 | 0.210204 | Reachable |
| Crashlytics | transport | Crashlytics settings | 404 | 0.318595 | Reachable |
| Performance Monitoring | transport | Performance logging | 000 | 10.001204 | Blocked |
| Remote Config | transport | Remote Config fetch | 000 | 10.000650 | Blocked |
| Cloud Messaging (FCM) | transport | Installations / FCM token | 000 | 10.000417 | Blocked |
| Cloud Messaging (FCM) | transport | FCM send host | 000 | 10.000718 | Blocked |
| App Check | transport | reCAPTCHA loader | 000 | 10.002148 | Blocked |
| App Distribution | transport | App Distribution | 000 | 10.000774 | Blocked |
| Cloud Messaging (FCM) | transport | FCM device channel | tcp | 0.301241 | Reachable |
| Hosting | transport | Firebase Hosting | 404 | 3.062072 | Reachable |
| Realtime Database | transport | Realtime Database | 401 | 1.498749 | Reachable |

## Backend choke point — OAuth2 token endpoint

Every backend Admin-SDK probe is Blocked. Firestore/Storage time out at their data
hosts, but Auth / FCM / Remote Config fail in ~1.4s with `auth-token-blocked`: the
Admin SDK cannot fetch an OAuth2 access token because the token endpoints are
unreachable from this node:

| Token endpoint | Result |
|---|---|
| oauth2.googleapis.com | timeout (curl exit 28) |
| accounts.google.com | timeout (curl exit 28) |
| www.googleapis.com | timeout (curl exit 28) |

The service account is valid — it seeded Firestore from a non-China host minutes
earlier — so this is a network block, not a credential problem. One blocked endpoint
(`oauth2.googleapis.com`) disables the entire server-side SDK.

## Provisioning depth (this run) & sampling

- Provisioned: Authentication (email user + anonymous), Realtime Database (legacy
  secret), Cloud Firestore (3 `reports` seeded via Admin SDK from a reachable host).
- Not provisioned: Cloud Storage default bucket is not initialized (`The specified
  bucket does not exist`), Cloud Functions not deployed, Remote Config template not
  published — none change the China verdict (the hosts are blocked regardless).
- Sampling: transport sampled 3× over ~1h. **Firebase Hosting** flipped
  Reachable (0.89s) → Blocked → Reachable (3.06s) — **intermittent / Degraded**.
  The Realtime Database connected on every sample (401 unauth, 1.5–6s; authed write
  200 in 0.9s).
