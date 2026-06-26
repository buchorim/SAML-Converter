// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import { readFile } from "node:fs/promises";
import { convertSvgFile } from "./Converter.js";
import { validateAlightMotionXml } from "./Validator.js";

const [, , command, ...args] = process.argv;

try {
  if (command === "convert") {
    await runConvert(args);
  } else if (command === "validate") {
    await runValidate(args);
  } else {
    printUsage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function runConvert(args: string[]): Promise<void> {
  const [inputPath, outputPath] = args;
  if (!inputPath || !outputPath) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const result = await convertSvgFile({ inputPath, outputPath });
  console.log("SML Verter");
  console.log(`Input  : ${result.report.inputPath}`);
  console.log(`Output : ${result.report.outputPath}`);
  console.log("");
  console.log("Converted");
  console.log(`- Layers exported: ${result.report.exportedLayers}`);
  console.log(`- Skipped elements: ${result.report.skippedElements}`);
  console.log(`- Warnings: ${result.report.warnings.length}`);

  if (result.report.warnings.length > 0) {
    console.log("");
    console.log("Warnings:");
    for (const warning of result.report.warnings) {
      console.log(`- ${warning.message}`);
    }
  }
}

async function runValidate(args: string[]): Promise<void> {
  const [xmlPath] = args;
  if (!xmlPath) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const xmlText = await readFile(xmlPath, "utf8");
  const result = validateAlightMotionXml(xmlText);
  console.log("SML Verter Validation");
  console.log(`Valid XML: ${result.valid ? "yes" : "no"}`);

  if (result.sceneSize) {
    console.log(`Scene size: ${result.sceneSize}`);
  }

  if (typeof result.layerCount === "number") {
    console.log(`Layers: ${result.layerCount}`);
  }

  if (result.errors.length > 0) {
    console.log("");
    console.log("Errors:");
    for (const error of result.errors) {
      console.log(`- ${error}`);
    }
  }

  process.exitCode = result.valid ? 0 : 1;
}

function printUsage(): void {
  console.log("Usage:");
  console.log("  node Dist/Cli.js convert <input.svg> <output.xml>");
  console.log("  node Dist/Cli.js validate <output.xml>");
}
