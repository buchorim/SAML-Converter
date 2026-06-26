# Phase 4 — Versioned Stress Suite

## Goal
Create a versioned Alight Motion XML stress-test export that combines complex downloaded SVG illustrations and many smaller vector examples into one importable project for manual layer-by-layer checking.

## Scope
- Keep owner-facing output under `Result/<version>/`.
- Keep SVG fixtures and downloaded source assets inside internal folders, not in the project root.
- Download two complex non-esport SVG illustrations from license-safe sources.
- Build a small SVG fixture sheet with many focused vector examples, including panda, shadow, stroke, gradient, clipping-style, basic geometry, and mixed vector cases.
- Generate one combined Alight Motion XML for version `1.1` with 80-100+ layers if feasible.
- Put complex illustrations into group layers and keep smaller examples as individual top-level layers.
- Add a version-local executable runner that validates and regenerates the version output.

## Features in This Phase

### Version Folder Output
Each version folder contains one XML project, a runner, and a report. The runner must fail loudly on conversion errors or warnings that should block manual testing. Successful runs write or refresh the XML and report inside the same version folder.

### Complex Illustration Groups
Two downloaded complex SVG illustrations are converted into separate `embedScene` group layers. Each converted SVG child layer stays inside its group so the owner can expand the group and inspect the converted pieces without the top-level timeline becoming unreadable.

### Small Example Sheet
Small examples are generated from internal SVG fixtures and emitted as individual layers in the same XML. These examples cover geometry, fills, gradient mapping, strokes, shadow output, simple panda illustration parts, clipping-mask structure where supported by observed XML, and other focused conversion cases.

### Dataset 1-4 Reverse Engineering
The exporter must account for the latest observed structures: `fillType="gradient"` with either fallback `fillColor` or explicit `<gradient>`, `hidden="true"`, `clippingMask="true"`, `<shadow direction="outside" />`, `<border direction="..." id="1" />`, `<path-stroke>` attributes, transform `location`, `scale`, `rotation`, `pivot`, `opacity`, grouped `embedScene`, and preset `.triangle` or path geometry.

## UI Mockup
Version folder layout:

```txt
Result/
  1.1/
    RunTest.bat
    SML_Verter_1.1.xml
    Report.txt
```

Running `RunTest.bat` from the version folder validates or regenerates the one XML file. No SVG files are shown in the root output area.

## Behavior & Logic Notes
SVG source assets may be downloaded from Wikimedia Commons, Openclipart, FreeSVG, or similar public-domain/open-license sources. The source URL and license basis must be recorded in the report. Esport logo XML may be used only as reverse-engineering evidence and must not be one of the complex SVG assets. If a downloaded SVG contains unsupported commands or features, the converter should either convert them safely or report a warning in the version report.

## Dependencies
- Phase 1 through Phase 3.
- Current dataset files in `Dataset/`.
- Network access for downloading complex SVG fixtures.

## Acceptance Criteria
- `Result/1.1/` exists.
- `Result/1.1/SML_Verter_1.1.xml` is one combined Alight Motion XML project.
- The XML validates with the local validator.
- The XML contains at least 80 converted layers when feasible.
- Two non-esport complex illustrations are represented as group layers.
- Small examples are individual layers in the same XML.
- `Result/1.1/RunTest.bat` runs the version validation/regeneration workflow.
- `Result/1.1/Report.txt` records layer count, warnings, dataset features used, downloaded asset sources, and validation status.
