// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import { DOMParser } from "@xmldom/xmldom";

export interface ValidationResult {
  valid: boolean;
  sceneSize?: string;
  layerCount?: number;
  errors: string[];
}

export function validateAlightMotionXml(xmlText: string): ValidationResult {
  const errors: string[] = [];
  const parser = new DOMParser({
    errorHandler: {
      warning: () => undefined,
      error: (message) => errors.push(message),
      fatalError: (message) => errors.push(message)
    }
  });
  const document = parser.parseFromString(xmlText, "application/xml");
  const root = document.documentElement;

  if (!root || root.tagName !== "scene") {
    errors.push("Root element must be <scene>.");
    return { valid: false, errors };
  }

  for (const attribute of ["width", "height", "exportWidth", "exportHeight", "totalTime", "fps", "amver", "ffver", "am"]) {
    if (!root.getAttribute(attribute)) {
      errors.push(`Root <scene> is missing required attribute: ${attribute}.`);
    }
  }

  const shapeNodes = Array.from(root.getElementsByTagName("shape"));
  for (const shape of shapeNodes) {
    if (!shape.getAttribute("id")) {
      errors.push("A <shape> layer is missing id.");
    }
    if (!shape.getAttribute("startTime") || !shape.getAttribute("endTime")) {
      errors.push(`Shape ${shape.getAttribute("id") || "(unknown)"} is missing timing attributes.`);
    }
    if (shape.getElementsByTagName("transform").length === 0) {
      errors.push(`Shape ${shape.getAttribute("id") || "(unknown)"} is missing <transform>.`);
    }
    if (!hasShapeGeometry(shape)) {
      errors.push(`Shape ${shape.getAttribute("id") || "(unknown)"} is missing supported geometry.`);
    }
  }

  return {
    valid: errors.length === 0,
    sceneSize: `${root.getAttribute("width")}x${root.getAttribute("height")}`,
    layerCount: shapeNodes.length,
    errors
  };
}

function hasShapeGeometry(shape: Element): boolean {
  if (shape.getElementsByTagName("path").length > 0) {
    return true;
  }

  const preset = shape.getAttribute("s");
  return Boolean(preset && shape.getElementsByTagName("property").length > 0);
}
