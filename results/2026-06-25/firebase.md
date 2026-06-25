# Firebase mainland China probe — 2026-06-25

- Generated: 2026-06-25T03:18:12Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Authentication | frontend | Auth anonymous sign-up | 000 | 10.001131 | Blocked |
| Authentication | frontend | Auth email sign-in | 000 | 10.000289 | Blocked |
| Cloud Firestore | frontend | Firestore read (unauth) | 000 | 10.001453 | Blocked |
| Cloud Storage | frontend | Storage download | 000 | 10.000308 | Blocked |
| Cloud Functions | frontend | Functions helloProbe | 000 | 10.002442 | Blocked |
| Firebase ML / Vision | transport | Cloud Vision API | 000 | 10.000807 | Blocked |
| Firebase AI Logic | transport | Gemini / AI Logic | 000 | 10.000704 | Blocked |
| Google Analytics | transport | Firebase Analytics | 404 | 0.201748 | Reachable |
| Crashlytics | transport | Crashlytics settings | 404 | 0.272317 | Reachable |
| Performance Monitoring | transport | Performance logging | 000 | 10.000791 | Blocked |
| Remote Config | transport | Remote Config fetch | 000 | 10.000633 | Blocked |
| Cloud Messaging (FCM) | transport | Installations / FCM token | 000 | 10.000962 | Blocked |
| Cloud Messaging (FCM) | transport | FCM send host | 000 | 10.000424 | Blocked |
| App Check | transport | reCAPTCHA loader | 000 | 10.000822 | Blocked |
| App Distribution | transport | App Distribution | 000 | 10.000900 | Blocked |
| Cloud Messaging (FCM) | transport | FCM device channel | tcp | 0.204770 | Reachable |
| Hosting | transport | Firebase Hosting | 404 | 0.890187 | Reachable |
| Realtime Database | transport | Realtime Database | 401 | 6.016429 | Degraded |
| Realtime Database | backend | RTDB authed write | 200 | 0.918415 | Reachable |

## Second sample (same host, ~6 min later)

A confirmation run reproduced every verdict except **Firebase Hosting**, which
flipped Reachable → Blocked (`code=000 total=1.252792s`). Hosting is therefore
**intermittent / Degraded** from this node, not reliably reachable.

Notes on provisioning depth (this run): Auth (email user + anonymous) and the
Realtime Database (legacy DB secret) are provisioned; Firestore/Storage/Functions/
Remote Config were not provisioned (no service account / no `firebase login`), so
their frontend probes measure host reachability, not a full authenticated round-trip.
The `*.googleapis.com` endpoints they depend on are Blocked regardless.
