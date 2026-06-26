// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportAlightMotionXml } from "./AlightMotionExporter.js";
import { parseSvgToVectorProject } from "./SvgParser.js";
import type { ConversionWarning, GradientStyle, GroupLayer, ProjectLayer, VectorLayer, VectorProject } from "./Types.js";
import { validateAlightMotionXml } from "./Validator.js";

const Version = process.argv[2] ?? "1.1";
const RootDirectory = process.cwd();
const ResultDirectory = join(RootDirectory, "Result", Version);
const AssetDirectory = join(RootDirectory, "Internal", "Assets", "Svg");
const FixtureDirectory = join(RootDirectory, "Internal", "Fixtures", "Svg", "Sheet");
const TotalTime = 30040;

interface BuildSummary {
  warnings: ConversionWarning[];
  skippedElements: number;
  complexGroups: number;
  individualLayers: number;
  totalShapes: number;
  validationErrors: string[];
}

await buildVersion();

async function buildVersion(): Promise<void> {
  await mkdir(ResultDirectory, { recursive: true });
  await mkdir(FixtureDirectory, { recursive: true });

  const warnings: ConversionWarning[] = [];
  const tigerGroup = await loadComplexGroup({
    fileName: "GhostscriptTiger.svg",
    label: "Complex Natural Illustration - Ghostscript Tiger",
    id: 111_000_001,
    childIdBase: 111_100_000,
    transform: {
      location: "300.000000,535.000000,0.000000",
      scale: "0.430000,0.430000"
    },
    warnings
  });
  const pandaGroup = await loadComplexGroup({
    fileName: "GiantPandaEatingBamboo.svg",
    label: "Complex Natural Illustration - Giant Panda",
    id: 111_000_002,
    childIdBase: 111_200_000,
    transform: {
      location: "780.000000,535.000000,0.000000",
      scale: "0.430000,0.430000"
    },
    warnings
  });
  const smallLayers = createSmallExampleLayers(111_300_000);

  await writeFile(join(FixtureDirectory, "SmallExampleSheet.svg"), renderSmallExampleSheet(), "utf8");

  const project: VectorProject = {
    metadata: {
      title: `SML Verter ${Version} Stress Test`,
      width: 1080,
      height: 1920,
      fps: 24,
      totalTime: TotalTime,
      backgroundColor: "#ffffffff"
    },
    layers: [tigerGroup, pandaGroup, ...smallLayers],
    warnings,
    skippedElements: tigerGroup.layers.length + pandaGroup.layers.length + smallLayers.length
  };
  const xml = exportAlightMotionXml(project);
  const xmlPath = join(ResultDirectory, `SML_Verter_${Version}.xml`);
  await writeFile(xmlPath, xml, "utf8");

  const validation = validateAlightMotionXml(xml);
  const totalShapes = countShapes(project.layers);
  const summary: BuildSummary = {
    warnings,
    skippedElements: 0,
    complexGroups: 2,
    individualLayers: smallLayers.length,
    totalShapes,
    validationErrors: validation.errors
  };

  await writeFile(join(ResultDirectory, "RunTest.bat"), renderRunTestBatch(), "utf8");
  await writeFile(join(ResultDirectory, "Report.txt"), renderReport(summary, validation.valid), "utf8");

  console.log(`SML Verter ${Version}`);
  console.log(`Output: ${xmlPath}`);
  console.log(`Complex groups: ${summary.complexGroups}`);
  console.log(`Individual layers: ${summary.individualLayers}`);
  console.log(`Total shape layers: ${summary.totalShapes}`);
  console.log(`Warnings: ${summary.warnings.length}`);
  console.log(`Valid XML: ${validation.valid ? "yes" : "no"}`);

  if (summary.warnings.length > 0) {
    console.log("");
    console.log("Warnings:");
    for (const warning of summary.warnings) {
      console.log(`- ${warning.message}`);
    }
  }

  if (!validation.valid) {
    console.log("");
    console.log("Validation errors:");
    for (const error of validation.errors) {
      console.log(`- ${error}`);
    }
    process.exitCode = 1;
  }
}

async function loadComplexGroup(options: {
  fileName: string;
  label: string;
  id: number;
  childIdBase: number;
  transform: GroupLayer["transform"];
  warnings: ConversionWarning[];
}): Promise<GroupLayer> {
  const filePath = join(AssetDirectory, options.fileName);
  const svgText = await readFile(filePath, "utf8");
  const parsed = parseSvgToVectorProject(svgText, filePath, {
    sceneWidth: 1080,
    sceneHeight: 1080,
    idBase: options.childIdBase,
    labelPrefix: options.fileName.replace(/\.svg$/u, "")
  });
  options.warnings.push(...parsed.project.warnings);

  return {
    kind: "group",
    id: options.id,
    label: options.label,
    layers: parsed.project.layers,
    transform: options.transform,
    startTime: 0,
    endTime: TotalTime,
    outTime: TotalTime,
    width: 1080,
    height: 1080,
    totalTime: TotalTime
  };
}

function createSmallExampleLayers(idBase: number): VectorLayer[] {
  const layers: VectorLayer[] = [];
  const positions = createGridPositions(5, 7, 155, 1080, 195, 135);
  let index = 0;
  const add = (label: string, pathData: string, options: Partial<VectorLayer> = {}) => {
    const position = positions[index % positions.length];
    layers.push({
      kind: "shape",
      id: idBase + index,
      label,
      pathData,
      fillType: options.fillType ?? "color",
      fillColor: options.fillColor ?? "#ff4f7cac",
      gradient: options.gradient,
      stroke: options.stroke,
      shadow: options.shadow,
      borderDirection: options.borderDirection,
      hidden: options.hidden,
      clippingMask: options.clippingMask,
      transform: {
        location: `${position.x.toFixed(6)},${position.y.toFixed(6)},0.000000`,
        scale: options.transform?.scale,
        rotation: options.transform?.rotation,
        opacity: options.transform?.opacity
      },
      startTime: options.startTime,
      endTime: options.endTime
    });
    index += 1;
  };

  add("Small Rect Solid", rect(-45, -32, 90, 64), { fillColor: "#ff457b9d" });
  add("Small Rounded Rect", roundedRect(-52, -34, 104, 68, 16), { fillColor: "#ffa8dadc" });
  add("Small Triangle", "M -55 45 L 0 -55 L 55 45 Z", { fillColor: "#ffe63946" });
  add("Small Diamond", "M 0 -60 L 60 0 L 0 60 L -60 0 Z", { fillColor: "#ff7b2cbf" });
  add("Small Star", "M 0 -62 L 16 -18 L 62 -18 L 25 8 L 38 55 L 0 27 L -38 55 L -25 8 L -62 -18 L -16 -18 Z", { fillColor: "#fff4a261" });
  add("Small Bolt", "M -16 -62 L 44 -62 L 10 -8 L 56 -8 L -28 64 L -4 8 L -56 8 Z", { fillColor: "#ffffbe0b" });
  add("Small Wave Curve", "M -65 24 C -30 -58, 25 -58, 62 24 L 62 58 C 20 16, -22 16, -65 58 Z", { fillColor: "#ff2a9d8f" });
  add("Small Stroke Only", "M -58 42 L 0 -58 L 58 42 Z", { fillType: "none", fillColor: "#ff111827", stroke: { color: "#ff111827", width: 11 } });
  add("Small Fill With Stroke", rect(-55, -35, 110, 70), { fillColor: "#ff90be6d", stroke: { color: "#ff90be6d", width: 9 }, borderDirection: "outside" });
  add("Small No Fill", rect(-48, -48, 96, 96), { fillType: "none", fillColor: "#ffa6ba94" });
  add("Gradient Minimal", rect(-50, -50, 100, 100), { fillType: "gradient", fillColor: "#ff5bfc8f" });
  add("Gradient Linear", rect(-50, -50, 100, 100), { fillType: "gradient", fillColor: "#ff5bfc8f", gradient: gradient("linear", "#ff000000", "#ffffffff") });
  add("Gradient Radial", rect(-50, -50, 100, 100), { fillType: "gradient", fillColor: "#ff5bfc8f", gradient: gradient("radial", "#ff000000", "#ffffffff") });
  add("Gradient Sweep", rect(-50, -50, 100, 100), { fillType: "gradient", fillColor: "#ff5bfc8f", gradient: gradient("sweep", "#ff000000", "#ffffffff") });
  add("Shadow Outside", roundedRect(-48, -38, 96, 76, 14), { fillColor: "#ff3d5942", shadow: true });
  add("Border Outside", roundedRect(-48, -38, 96, 76, 14), { fillColor: "#ffef476f", borderDirection: "outside" });
  add("Clipping Base", rect(-55, -35, 110, 70), { fillColor: "#ffa2d8a6" });
  add("Clipping Mask Layer", "M -55 35 L 0 -48 L 55 35 Z", { fillColor: "#ff17e1e1", clippingMask: true });
  add("Hidden Reference", rect(-45, -45, 90, 90), { fillColor: "#fff590e9", hidden: true });
  add("Rotated Shape", rect(-45, -30, 90, 60), { fillColor: "#ff118ab2", transform: { rotation: "18.000000" } });
  add("Opacity Shape", rect(-45, -45, 90, 90), { fillColor: "#ff073b4c", transform: { opacity: "0.520000" } });
  add("Timeline Offset", rect(-45, -45, 90, 90), { fillColor: "#ff759080", startTime: 1000, endTime: TotalTime });
  add("Panda Head", ellipse(0, 0, 58, 48), { fillColor: "#ffffffff", borderDirection: "outside" });
  add("Panda Left Ear", ellipse(-42, -40, 24, 24), { fillColor: "#ff111111" });
  add("Panda Right Ear", ellipse(42, -40, 24, 24), { fillColor: "#ff111111" });
  add("Panda Left Eye Patch", ellipse(-24, -8, 18, 24), { fillColor: "#ff111111", transform: { rotation: "-18.000000" } });
  add("Panda Right Eye Patch", ellipse(24, -8, 18, 24), { fillColor: "#ff111111", transform: { rotation: "18.000000" } });
  add("Panda Nose", ellipse(0, 18, 12, 8), { fillColor: "#ff111111" });
  add("Panda Bamboo Stem", rect(-10, -58, 20, 118), { fillColor: "#ff2f9e44", transform: { rotation: "-20.000000" } });
  add("Panda Bamboo Leaf 1", "M 8 -30 C 55 -65, 72 -38, 18 -16 Z", { fillColor: "#ff57cc6f" });
  add("Panda Bamboo Leaf 2", "M -4 4 C -58 -20, -68 10, -8 28 Z", { fillColor: "#ff57cc6f" });
  add("Line Segment Stroke", "M -62 0 L 62 0", { fillType: "none", fillColor: "#ff1f2937", stroke: { color: "#ff1f2937", width: 14, cap: "round" } });
  add("Open Polyline Stroke", "M -62 36 L -20 -32 L 20 32 L 62 -36", { fillType: "none", fillColor: "#ff9b5de5", stroke: { color: "#ff9b5de5", width: 10, join: "round" } });
  add("Layer Scale Positive", rect(-36, -36, 72, 72), { fillColor: "#ff06d6a0", transform: { scale: "1.220000,1.220000" } });
  add("Layer Scale Mirror", rect(-36, -36, 72, 72), { fillColor: "#ffff006e", transform: { scale: "-1.000000,1.000000" } });

  return layers;
}

function createGridPositions(columns: number, rows: number, startY: number, endY: number, cellWidth: number, cellHeight: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const startX = (1080 - (columns - 1) * cellWidth) / 2;
  const rowStep = (endY - startY) / Math.max(1, rows - 1);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      positions.push({ x: startX + column * cellWidth, y: startY + row * rowStep + (row % 2) * 12 });
    }
  }
  return positions;
}

function countShapes(layers: ProjectLayer[]): number {
  return layers.reduce((count, layer) => count + (layer.kind === "group" ? countShapes(layer.layers) : 1), 0);
}

function gradient(type: GradientStyle["type"], startColor: string, endColor: string): GradientStyle {
  return {
    type,
    startColor,
    endColor,
    start: "0.384451,0.215333",
    end: "1.000000,1.000000"
  };
}

function rect(x: number, y: number, width: number, height: number): string {
  return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
}

function roundedRect(x: number, y: number, width: number, height: number, radius: number): string {
  const c = 0.5522847498307936;
  const rx = Math.min(radius, width / 2);
  const ry = Math.min(radius, height / 2);
  return [
    `M ${x + rx} ${y}`,
    `L ${x + width - rx} ${y}`,
    `C ${x + width - rx + rx * c} ${y}, ${x + width} ${y + ry - ry * c}, ${x + width} ${y + ry}`,
    `L ${x + width} ${y + height - ry}`,
    `C ${x + width} ${y + height - ry + ry * c}, ${x + width - rx + rx * c} ${y + height}, ${x + width - rx} ${y + height}`,
    `L ${x + rx} ${y + height}`,
    `C ${x + rx - rx * c} ${y + height}, ${x} ${y + height - ry + ry * c}, ${x} ${y + height - ry}`,
    `L ${x} ${y + ry}`,
    `C ${x} ${y + ry - ry * c}, ${x + rx - rx * c} ${y}, ${x + rx} ${y}`,
    "Z"
  ].join(" ");
}

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  const c = 0.5522847498307936;
  return [
    `M ${cx + rx} ${cy}`,
    `C ${cx + rx} ${cy + ry * c}, ${cx + rx * c} ${cy + ry}, ${cx} ${cy + ry}`,
    `C ${cx - rx * c} ${cy + ry}, ${cx - rx} ${cy + ry * c}, ${cx - rx} ${cy}`,
    `C ${cx - rx} ${cy - ry * c}, ${cx - rx * c} ${cy - ry}, ${cx} ${cy - ry}`,
    `C ${cx + rx * c} ${cy - ry}, ${cx + rx} ${cy - ry * c}, ${cx + rx} ${cy}`,
    "Z"
  ].join(" ");
}

function renderRunTestBatch(): string {
  return [
    "@echo off",
    "REM / - Arinara Network © 2026 - /",
    "REM This source code is the exclusive property of Arinara Network.",
    "REM Unauthorized use, reproduction, distribution, or modification of this",
    "REM code — in whole or in part — for any purpose whatsoever is strictly",
    "REM prohibited without prior written consent from Arinara Network as the",
    "REM sole legal owner of this codebase.",
    "setlocal",
    "pushd \"%~dp0..\\..\"",
    "call npm run build",
    "if errorlevel 1 exit /b %errorlevel%",
    `node Dist\\VersionBuilder.js ${Version}`,
    "if errorlevel 1 exit /b %errorlevel%",
    "popd",
    "endlocal",
    ""
  ].join("\r\n");
}

function renderReport(summary: BuildSummary, valid: boolean): string {
  return `SML Verter ${Version} Stress Test
Generated: 2026-06-19

Output
- XML: Result/${Version}/SML_Verter_${Version}.xml
- Runner: Result/${Version}/RunTest.bat
- One combined XML project: yes

Layer Counts
- Complex illustration groups: ${summary.complexGroups}
- Individual small example layers: ${summary.individualLayers}
- Total shape layers including group contents: ${summary.totalShapes}

Validation
- Local XML validation: ${valid ? "passed" : "failed"}
- Validation errors: ${summary.validationErrors.length}

Dataset Features Learned
- Dataset 1: outline paths, path stroke, animated path knots, preset rect/roundrect, gradient fillType, drawing, embedScene.
- Dataset 2: hidden layer, no-fill preset, transform keyframes, clippingMask, shadow, timeline offset, empty group.
- Dataset 3: border, advanced path-stroke cap/join, animated multi-point vectors.
- Dataset 4: complex grouped logo structure, transform scale/rotation/opacity/pivot, explicit gradient element, triangle preset evidence.
- Dataset 5: minimal gradient, radial gradient, sweep gradient.

Downloaded Complex SVG Sources
- GhostscriptTiger.svg: Wikimedia Commons File:Ghostscript Tiger.svg, AGPL/free software source, https://commons.wikimedia.org/wiki/File:Ghostscript_Tiger.svg
- GiantPandaEatingBamboo.svg: Openclipart Giant panda eating bamboo, public-domain clip art source, https://openclipart.org/detail/327536/giant-panda-eating-bamboo

Warnings
${summary.warnings.length === 0 ? "- None" : summary.warnings.map((warning) => `- [${warning.code}] ${warning.message}`).join("\n")}
`;
}

function renderSmallExampleSheet(): string {
  return `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="LinearTest" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000000" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
  </defs>
  <rect x="80" y="120" width="120" height="80" fill="#457b9d" />
  <rect x="240" y="120" width="120" height="80" rx="18" fill="#a8dadc" />
  <path d="M 460 210 L 520 110 L 580 210 Z" fill="url(#LinearTest)" />
  <path d="M 710 100 L 770 220 L 650 220 Z" fill="none" stroke="#111827" stroke-width="12" />
  <circle cx="900" cy="165" r="52" fill="#ffffff" stroke="#111111" stroke-width="8" />
</svg>
`;
}
