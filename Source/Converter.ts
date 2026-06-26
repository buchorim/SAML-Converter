// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { exportAlightMotionXml } from "./AlightMotionExporter.js";
import { parseSvgToVectorProject } from "./SvgParser.js";
import type { ConversionReport } from "./Types.js";
import { validateAlightMotionXml } from "./Validator.js";

export interface ConvertOptions {
  inputPath: string;
  outputPath: string;
}

export interface ConvertResult {
  xml: string;
  report: ConversionReport;
}

export async function convertSvgFile(options: ConvertOptions): Promise<ConvertResult> {
  const svgText = await readFile(options.inputPath, "utf8");
  const parsed = parseSvgToVectorProject(svgText, options.inputPath);
  const xml = exportAlightMotionXml(parsed.project);
  const validation = validateAlightMotionXml(xml);

  if (!validation.valid) {
    throw new Error(`Generated XML failed validation: ${validation.errors.join("; ")}`);
  }

  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, xml, "utf8");

  return {
    xml,
    report: {
      inputPath: options.inputPath,
      outputPath: options.outputPath,
      exportedLayers: parsed.project.layers.length,
      skippedElements: parsed.project.skippedElements,
      warnings: parsed.project.warnings
    }
  };
}
