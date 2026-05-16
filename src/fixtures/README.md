# Fixtures

Real-world (synthetic, no PII) logcat samples used by parser tests and
benchmarks. See `docs/PARSER_SPEC.md` §10.2.

Pending samples (will be added Day 2–4):

| File | Purpose | Approx. size |
|---|---|---|
| `threadtime-normal.log` | Healthy app run, threadtime format | ~10 MB |
| `threadtime-crash.log` | Contains `FATAL EXCEPTION` + Caused-by chain | ~1 MB |
| `threadtime-anr.log` | Contains `ANR in …` section | ~5 MB |
| `time-format.log` | `time` format sample | ~500 KB |
| `brief-snippet.log` | Pasted from chat — small `brief` | < 10 KB |
| `mixed-noise.log` | Divider lines + raw text mixed in | ~2 MB |
| `huge.log` | Perf-test sample, ~10⁵ lines | ~30 MB |

**Rules:**

- Never commit logs containing real package names, user data, or device
  fingerprints. Use synthetic apps (e.g. `com.example.demo`).
- Files larger than 5 MB use Git LFS.
