---
Model    : GPT-5
Thinking : High
---

# Codex — SML Verter

## What Is This
SML Verter is a converter that turns supported SVG artwork into an Alight Motion project XML file. It solves the problem of moving vector artwork into Alight Motion while preserving import validity and making any unsupported SVG features visible to the user.

## Who Is It For
This tool is for motion editors, template creators, and technical artists who create vector graphics in SVG-capable tools and need those graphics represented as editable Alight Motion vector layers.

## Business Model
Internal tooling — no monetization.

## Pricing
Not determined — to be defined before public release.

## How to Use
1. Prepare an SVG file that uses supported vector features such as paths, simple fills, rectangles, and rounded rectangles.
2. Run the converter with the SVG input path and desired XML output path.
3. Review the conversion report for unsupported SVG features or fidelity warnings.
4. Import the generated XML project into Alight Motion.
5. Adjust animation, grouping, timing, and unsupported visual effects inside Alight Motion when needed.

## Key Constraints & Assumptions
The converter is based on limited public information and local reverse-engineering samples. Initial output targets Alight Motion XML compatible with the observed Android export version `5.0.273.1028425`. The first supported scope is static vector artwork: SVG path data, simple fill colors, simple stroke data where mapping is known, rectangles, rounded rectangles, dimensions, layer names, and grouping where feasible. Advanced SVG features such as filters, masks, clip paths, text shaping, gradients, blend modes, embedded images, and animation are out of scope until more reference datasets or verified import behavior are available.
