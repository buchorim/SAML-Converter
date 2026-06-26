# Phase 2 — Core Converter

## Goal
Implement a working SVG-to-Alight-Motion XML converter for the safest supported static vector subset.

## Scope
- Scaffold a small command-line project.
- Parse SVG files with structured XML parsing.
- Normalize supported SVG elements into an intermediate vector model.
- Export the intermediate model as Alight Motion XML.
- Produce a conversion report with warnings and errors.

## Features in This Phase

### SVG Input Parser
The parser reads SVG XML and extracts canvas dimensions, viewBox, groups, paths, rectangles, rounded rectangles, basic fill colors, basic stroke colors, stroke width, element IDs, and labels. It must reject malformed SVG with an explicit error. It must preserve path data when it is already compatible with Alight Motion path syntax, and it must convert supported primitive shapes into outline path data when needed.

### Intermediate Vector Model
The converter uses an internal model for project metadata, layers, transforms, shape paths, fill styles, stroke styles, and warnings. This keeps SVG details separate from Alight Motion XML details and allows tests to target each stage independently.

### Alight Motion XML Exporter
The exporter creates a root `<scene>` using observed metadata defaults and one shape layer per supported input element. Static shape layers include `id`, `label`, `startTime`, `endTime`, `fillType`, `mediaFillMode`, `<transform>`, `<fillColor>`, optional `<path-stroke>`, and `<path d="...">`. Unsupported styling should never create invalid XML.

### Conversion Report
Each conversion returns a user-readable report with exported layer count, skipped element count, warnings, and fatal errors. The CLI prints the report and exits with a non-zero status only for fatal errors.

## UI Mockup
Command-line layout:

```txt
SML Verter
Input  : Assets/Icon.svg
Output : Exports/Icon.am.xml

Converted
- Layers exported: 4
- Warnings: 1
```

There is no graphical UI in this phase. Empty states are invalid input paths, missing output directory, malformed SVG, unsupported-only SVG, or XML write failure. Loading state is represented by concise CLI progress output for parse, convert, and export steps.

## Behavior & Logic Notes
Coordinate mapping must account for SVG viewBox origin and canvas size. Alight Motion shape path coordinates in the sample are relative to the layer transform location, so exported layers should place each shape around its own center where practical. The exporter should use deterministic IDs starting from a configured base. Colors should be emitted as Alight Motion ARGB hex strings.

## Dependencies
- Phase 1 — Reverse Engineering completed.
- A chosen runtime and package setup.

## Acceptance Criteria
- A CLI command converts a simple SVG path into a valid Alight Motion XML scene.
- Rectangles and rounded rectangles convert into shape paths.
- Solid fill colors are preserved as ARGB values.
- Basic stroke width mapping is emitted when supported.
- Unsupported features are reported in the conversion output.
- Automated validation confirms generated XML is well formed.
