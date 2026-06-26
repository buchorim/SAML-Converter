// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import assert from "node:assert/strict";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { convertSvgFile } from "../Dist/Converter.js";
import { validateAlightMotionXml } from "../Dist/Validator.js";

const tempDirectory = join(process.cwd(), "TempTestOutput");

test("converts a simple SVG path into valid Alight Motion XML", async () => {
  await mkdir(tempDirectory, { recursive: true });
  const inputPath = join(tempDirectory, "SimplePath.svg");
  const outputPath = join(tempDirectory, "SimplePath.xml");
  await writeFile(
    inputPath,
    `<svg width="100" height="100" viewBox="0 0 100 100"><path id="Triangle" fill="#336699" d="M 10 10 L 90 10 L 50 80 Z"/></svg>`,
    "utf8"
  );

  const result = await convertSvgFile({ inputPath, outputPath });
  const outputXml = await readFile(outputPath, "utf8");
  const validation = validateAlightMotionXml(outputXml);

  assert.equal(result.report.exportedLayers, 1);
  assert.equal(validation.valid, true);
  assert.match(outputXml, /<scene /);
  assert.match(outputXml, /label="Triangle"/);
  assert.match(outputXml, /fillColor value="#ff336699"/);
  assert.match(outputXml, /<path d="M-432 -432L432 -432L0 324L-432 -432" \/>/);
});

test("converts a rounded rectangle into cubic outline path data", async () => {
  await mkdir(tempDirectory, { recursive: true });
  const inputPath = join(tempDirectory, "RoundRect.svg");
  const outputPath = join(tempDirectory, "RoundRect.xml");
  await writeFile(
    inputPath,
    `<svg width="200" height="100"><rect id="Panel" x="10" y="10" width="80" height="40" rx="10" fill="#ff0000"/></svg>`,
    "utf8"
  );

  const result = await convertSvgFile({ inputPath, outputPath });
  const outputXml = await readFile(outputPath, "utf8");

  assert.equal(result.report.exportedLayers, 1);
  assert.match(outputXml, /label="Panel"/);
  assert.match(outputXml, /C-/);
});

test("maps SVG gradients to Alight Motion gradient fill", async () => {
  await mkdir(tempDirectory, { recursive: true });
  const inputPath = join(tempDirectory, "Gradient.svg");
  const outputPath = join(tempDirectory, "Gradient.xml");
  await writeFile(
    inputPath,
    `<svg width="100" height="100"><defs><linearGradient id="g"/></defs><path id="Glow" fill="url(#g)" d="M 0 0 L 10 0 L 0 10 Z"/></svg>`,
    "utf8"
  );

  const result = await convertSvgFile({ inputPath, outputPath });
  const outputXml = await readFile(outputPath, "utf8");
  const validation = validateAlightMotionXml(outputXml);

  assert.equal(result.report.exportedLayers, 1);
  assert.equal(validation.valid, true);
  assert.equal(result.report.warnings.length, 0);
  assert.match(outputXml, /fillType="gradient"/);
  assert.match(outputXml, /<gradient type="linear"/);
});

test("validates provided Alight Motion dataset samples", async () => {
  const datasetNames = [
    "Dataset 1 - Basic.xml",
    "Dataset 2 - Basic.xml",
    "Dataset 3 - Advanced .xml",
    "Dataset 4 - Complex  Esport Logo.xml",
    "Dataset 5- Basic Gradient .xml"
  ];

  for (const datasetName of datasetNames) {
    const datasetPath = join(process.cwd(), "Dataset", datasetName);
    const datasetXml = await readFile(datasetPath, "utf8");
    const validation = validateAlightMotionXml(datasetXml);

    assert.equal(validation.valid, true, datasetName);
    assert.ok(validation.layerCount > 0, datasetName);
  }
});

test("converts every example SVG into valid XML", async () => {
  await mkdir(tempDirectory, { recursive: true });
  const exampleDirectory = join(process.cwd(), "Internal", "Fixtures", "Svg", "Legacy", "Examples");
  const exampleNames = (await readdir(exampleDirectory)).filter((name) => name.endsWith(".svg"));

  assert.ok(exampleNames.length >= 10);

  for (const exampleName of exampleNames) {
    const inputPath = join(exampleDirectory, exampleName);
    const outputPath = join(tempDirectory, exampleName.replace(/\.svg$/u, ".xml"));
    const result = await convertSvgFile({ inputPath, outputPath });
    const outputXml = await readFile(outputPath, "utf8");
    const validation = validateAlightMotionXml(outputXml);

    assert.ok(result.report.exportedLayers > 0, exampleName);
    assert.equal(validation.valid, true, exampleName);
  }
});

test.after(async () => {
  await rm(tempDirectory, { recursive: true, force: true });
});
