# `targets.json` schema

`targets.json` is the single source of truth for what the lab measures. Both the network probe
and the Playwright suite read it.

Each entry in `services[]`:

| Field | Required | Description |
|---|---|---|
| `id` | yes | Stable slug, kebab-case (e.g. `google-fonts`). Used as the key in results. |
| `name` | yes | Human-readable service name (e.g. `Google Fonts`). |
| `category` | yes | One of `fonts`, `auth`, `analytics`, `embeds`. |
| `domain` | yes | The host whose reachability defines the verdict (e.g. `fonts.googleapis.com`). |
| `url` | yes | A concrete URL the probe requests with `curl`. |
| `demoPath` | yes | Path to the matching demo page (e.g. `/demos/fonts-google.html`). |
| `symptom` | yes | One-line description of what a user in mainland China sees when this dependency fails. Surfaced on the Beijing View page. |

## Verdict definitions

Verdicts are deliberately about **reachability and latency**, not HTTP semantics. A `404` or `403`
still means the network path works, so it counts as `Reachable`.

| Verdict | Network condition |
|---|---|
| `Blocked` | Connection failed or timed out (curl error, or HTTP code `000`). |
| `Degraded` | Connected, but total time exceeded the slow threshold (default 5s). |
| `Reachable` | Connected within the threshold and returned any HTTP status. |
