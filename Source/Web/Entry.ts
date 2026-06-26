// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import { parseSvgToVectorProject } from "../SvgParser.js";
import { exportAlightMotionXml } from "../AlightMotionExporter.js";

export interface WebConvertResult {
  filename: string;
  xml: string;
}

export function convertSvgToXml(svgText: string, filename: string): WebConvertResult {
  const result = parseSvgToVectorProject(svgText, filename);
  const xml = exportAlightMotionXml(result.project);
  const baseName = filename.replace(/\.svg$/iu, "");
  return { filename: `${baseName}.xml`, xml };
}

(window as unknown as Record<string, unknown>).SmlVerter = { convertSvgToXml };
