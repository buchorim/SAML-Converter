# Rules — SML Verter

Last Updated: 2026-06-19

---

## Engineering Rules

### R-001 — Preserve Alight Motion XML Validity
All generated project files must remain valid Alight Motion project XML that can be imported into Alight Motion without parser errors. Implementations must be based on observed dataset structure, explicit schemas derived from samples, or verified app behavior. Violations include emitting undocumented top-level tags, omitting required project metadata, or silently generating malformed XML.

### R-002 — Keep Dataset Samples Immutable
Files in `Dataset/` are source-of-truth reverse-engineering inputs and must not be edited, reformatted, renamed, or overwritten. Any derived notes, schemas, fixtures, or normalized examples must be created outside `Dataset/`. Violations include saving parsed output back into the dataset folder or modifying sample XML formatting in place.

### R-003 — Separate Parsing, Conversion, and Export Logic
SVG parsing, intermediate shape modeling, Alight Motion mapping, and XML export must be implemented as separate responsibilities. This keeps reverse-engineered assumptions testable and prevents app-specific XML details from leaking through the entire codebase. Violations include one large function that parses SVG strings and directly concatenates Alight Motion XML.

---

## Design Rules

### R-004 — Surface Conversion Limits Clearly
When a SVG feature cannot be faithfully represented in Alight Motion XML, the tool must report the limitation clearly instead of pretending the result is exact. Violations include ignoring unsupported gradients, masks, filters, or paths without warning the user.

### R-005 — Prefer Inspectable Outputs
Generated conversion artifacts should be easy to inspect during development, including readable XML formatting and structured logs for inferred mappings. Minification is allowed only for final release output if it does not affect Alight Motion import behavior.

---

## Release Rules

### R-006 — Validate Before Release
No release may be marked ready until converter output is validated with automated XML checks and at least one representative SVG-to-Alight-Motion conversion fixture. If direct Alight Motion import validation is not available, the release notes must state the validation limit.

### R-007 — Versioned Result Folders
Every generated owner-facing test version must live under `Result/<major.minor>/` and contain one combined Alight Motion XML project for that version. New major test changes must copy or preserve the previous version folder and create a new version folder instead of overwriting it. Violations include placing owner-facing SVG fixtures in the root, generating many separate XML files for one test version, or replacing an older result version in place.
