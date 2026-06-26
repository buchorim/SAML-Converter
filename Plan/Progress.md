# Progress — SML Verter
Last Updated: 2026-06-20

## Current Phase
Phase 4 — Versioned Stress Suite [In Progress]

## Phase Overview

| Phase | Name | Status |
|---|---|---|
| 1 | ReverseEngineering | Completed |
| 2 | CoreConverter | Completed |
| 3 | ValidationAndRelease | In Progress |
| 4 | VersionedStressSuite | In Progress |

## Completed Tasks
- [x] Created root `Rules.md` with converter-specific XML validity and dataset immutability rules — Phase 1
- [x] Confirmed `Dataset/Dataset 1 - Basic.xml` exists and parsed as XML — Phase 1
- [x] Identified observed layer structures: text, shape, drawing, embedded scene, outline path, preset rect, preset roundrect, stroke, and animated knot path — Phase 1
- [x] Derived the initial safe static-vector conversion target — Phase 1
- [x] Scaffolded the TypeScript CLI converter project — Phase 2
- [x] Implemented SVG parsing into an intermediate vector model — Phase 2
- [x] Implemented Alight Motion XML export for supported path and rectangle layers — Phase 2
- [x] Added validation support for outline path and observed preset shape geometry — Phase 3
- [x] Added automated tests for conversion, gradient warnings, dataset validation, and all examples — Phase 3
- [x] Generated multiple separate ready-to-test XML exports in `Exports/ReadyToTest/` — Phase 3
- [x] Re-learned Dataset 1 through Dataset 5, including advanced gradient, group, transform, border, clipping, hidden, and shadow structures — Phase 4
- [x] Moved owner-facing generated XML workflow to versioned `Result/<version>/` folders — Phase 4
- [x] Downloaded two non-esport complex natural SVG illustrations for grouped conversion — Phase 4
- [x] Created an internal small SVG example sheet and individual example layers — Phase 4
- [x] Generated `Result/1.1/SML_Verter_1.1.xml` as one combined 115-shape XML stress-test project — Phase 4
- [x] Added `Result/1.1/RunTest.bat` and `Result/1.1/Report.txt` — Phase 4
- [x] Fixed fill inheritance bug: `@xmldom/xmldom` returns `""` instead of `null` for missing attributes, breaking CSS fill inheritance from parent `<g>` elements — Phase 2 (bugfix 1.1.1)
- [x] Generated `Result/1.1.1/SML_Verter_1.1.1.xml` with correct fill colors (49 unique colors, 102 color-filled shapes) — Phase 4
- [x] Learned Dataset 6 (Vector & Layer), Dataset 7 (Known Limitations), Dataset 8 (Effects), Dataset 9 (Keyframe Graph), Lines Dataset — Phase 1
- [x] Expanded Color.ts: full 147 CSS named colors + HSL/HSLA color parsing — Phase 2
- [x] Added CSS `<style>` block parsing for class-based fills from Illustrator/Figma SVGs — Phase 2
- [x] Added `<use>` element resolution with href lookup and x/y offset — Phase 2
- [x] Added `<text>` → AM text layer conversion (Roboto default, font-size, text-anchor→align) — Phase 2
- [x] Added `<feGaussianBlur>` → AM `com.alightcreative.effects.gaussianblur` mapping — Phase 2
- [x] Added `display:none`/`visibility:hidden` → skip element — Phase 2
- [x] Added stroke `linecap`/`linejoin` inheritance from CSS and parent groups — Phase 2
- [x] Added group opacity propagation → per-layer `transform.opacity` — Phase 2
- [x] Added SVG `mix-blend-mode` → AM `blending` attribute mapping (15 modes) — Phase 2
- [x] Added EffectDefinition and BlendingMode types to Types.ts — Phase 2
- [x] Added renderTextLayer and renderEffects to AlightMotionExporter — Phase 2
- [x] Regenerated v1.1.1 stress test — 369 shapes, 0 warnings — Phase 4

## In Progress
- [ ] Owner import checks for `Result/1.1.1/SML_Verter_1.1.1.xml` in Alight Motion — Phase 4

## Pending
- [ ] Package a beta binary when release is requested — Phase 3

## Blocked
- None
