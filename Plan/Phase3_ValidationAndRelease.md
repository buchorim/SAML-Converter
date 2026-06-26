# Phase 3 — Validation And Release

## Goal
Strengthen confidence that generated XML remains import-safe and package the converter for practical use.

## Scope
- Add representative SVG fixtures.
- Add multiple ready-to-test generated XML exports for owner import checks.
- Add automated tests for parsing, conversion, XML export, and warning behavior.
- Add a validation command for generated XML.
- Prepare a beta binary release when the owner requests shipping.

## Features in This Phase

### Fixture Coverage
Fixtures cover path-only SVGs, rectangles, rounded rectangles, grouped shapes, basic strokes, unsupported gradients, unsupported filters, malformed SVG, and empty SVG documents. Fixtures must live outside `Dataset/` and must not alter reverse-engineering samples.

### XML Validation
The project validates generated XML with a strict XML parser and structural checks for required Alight Motion scene and layer fields. Shape layers are valid when they use either outline path data or observed Alight Motion preset shape properties such as `.rect` and `.roundrect`. Validation does not claim successful Alight Motion import unless the file is actually imported or tested with a verified app workflow.

### Owner Test Export Set
The project provides multiple separate XML files generated from supported SVG fixtures. Each export must use a unique file path so new tests do not overwrite earlier output. The files should cover path-only vectors, rectangles, rounded rectangles, mixed layers, stroke-only shapes, and unsupported-feature warning behavior where a valid partial XML can still be generated.

### Release Packaging
When release is requested, the converter is packaged as a compiled or bundled binary appropriate for the target platform. Public release notes must describe user-visible conversion support and validation limits.

## UI Mockup
Validation command layout:

```txt
> sml-verter validate Output.xml

Valid XML: yes
Scene size: 1080x1920
Layers: 4
Required fields: present
Alight Motion import tested: no
```

No graphical UI is part of this phase. Empty states include missing XML file and malformed XML. Main interactions are running validation and reading pass or fail output.

## Behavior & Logic Notes
Tests should verify behavior rather than exact formatting where whitespace is irrelevant. Exact XML snapshots are acceptable only for stable minimal fixtures. Release packaging must not expose source code as the user-facing deliverable unless explicitly requested.

## Dependencies
- Phase 2 — Core Converter completed.
- Representative conversion fixtures.

## Acceptance Criteria
- Tests cover successful conversion and expected warning paths.
- The validation command detects malformed XML and missing required structure.
- Multiple generated XML files are available in an export folder for owner import testing.
- A beta build can be produced on request.
- `Progress.md` is updated before any release handoff.
