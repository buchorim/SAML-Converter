# Phase 1 — Reverse Engineering

## Goal
Derive a practical Alight Motion XML export model from the provided dataset so the converter starts from observed structure instead of guessed XML.

## Scope
- Inspect immutable sample XML files in `Dataset/`.
- Document observed scene, layer, transform, fill, stroke, path, preset shape, text, drawing, and group structures.
- Identify which structures are safe for initial SVG conversion.
- Keep reverse-engineered assumptions explicit and testable.

## Features in This Phase

### Dataset Structure Notes
The sample XML contains a root `<scene>` with project metadata including canvas size, export size, frame rate, total time, Alight Motion version metadata, background color, precompose mode, and retime settings. It includes top-level text, shape, drawing, and embedded scene layers. Shape layers may use outline path data through `<path d="...">`, animated knot data through nested `<knot>` elements, or Alight Motion preset identifiers such as `s=".rect"` and `s=".roundrect"` with property children.

### Initial Safe XML Target
The first converter target is a static `<scene>` containing one `<shape>` per supported SVG element. Each shape will include stable layer metadata, a `<transform>` with location, a `<fillColor>`, and a `<path d="...">` or a recognized preset shape structure only when the preset mapping is directly supported. The exporter will prefer outline paths because the sample demonstrates that imported vector outlines are represented this way.

### Unsupported Feature Reporting
Unsupported or uncertain SVG structures must be collected into a conversion report. The conversion should complete when a valid partial result can be generated, but it must fail when required input is malformed or when no supported layers can be exported.

## UI Mockup
Initial delivery is a command-line workflow:

```txt
> sml-verter convert Input.svg Output.xml

Input:  Input.svg
Output: Output.xml
Layers: 6 exported, 2 warnings

Warnings:
- linearGradient on path "LogoGlow" is not supported yet; used fallback fill color.
- filter on group "Shadow" was skipped.
```

Desktop and mobile graphical interfaces are not part of this phase. Empty input should print a clear error. Long conversions should stream concise progress lines. Main interactions are command invocation, XML output creation, and review of warnings.

## Behavior & Logic Notes
The dataset folder must remain immutable. Derived findings belong in project documentation or test fixtures outside `Dataset/`. Reverse-engineered metadata should be conservative: canvas defaults may be copied from the sample, but generated layer IDs must be deterministic enough for testing and unique enough for valid XML.

## Dependencies
- Provided Alight Motion XML dataset.
- `Rules.md` project rules.

## Acceptance Criteria
- The root rules file exists and includes converter-specific validity rules.
- The dataset structure is inspected without modifying `Dataset/`.
- A documented initial conversion target is available for implementation.
- `Progress.md` records the phase status and completed work.
