// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import { DOMParser } from "@xmldom/xmldom";
import { basename, extname } from "node:path";
import { SVGPathData } from "svg-pathdata";
import { toAlightArgbColor } from "./Color.js";
import type { BlendingMode, ConversionWarning, EffectDefinition, GradientStyle, ProjectLayer, StrokeStyle, SvgParseResult, SvgViewport, TextLayer, VectorLayer, VectorProject } from "./Types.js";

interface SvgParseOptions {
  title?: string;
  sceneWidth?: number;
  sceneHeight?: number;
  idBase?: number;
  maxLayers?: number;
  labelPrefix?: string;
}

interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

interface StyleContext {
  fill?: string;
  fillOpacity: number;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity: number;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  filter?: string;
  display?: string;
  visibility?: string;
  mixBlendMode?: string;
}

interface FilterDefinition {
  id: string;
  type: "gaussianBlur";
  stdDeviation: number;
}

interface GradientDefinition {
  id: string;
  type: "linear" | "radial";
  startColor: string;
  endColor: string;
  start: string;
  end: string;
}

const DefaultSceneWidth = 1080;
const DefaultSceneHeight = 1920;
const DefaultDurationMs = 30040;
const DefaultFps = 24;
const IdentityMatrix: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const SkipContainerTags = new Set(["defs", "metadata", "script", "radialGradient", "mask", "clipPath", "pattern", "symbol", "title", "desc", "sodipodi:namedview"]);
const UnsupportedDrawableTags = new Set(["image"]);

const SvgToAlightBlending: Record<string, BlendingMode> = {
  multiply: "multiply", screen: "screen", overlay: "overlay",
  darken: "darken", lighten: "lighten",
  "color-dodge": "color-dodge", "color-burn": "color-burn",
  "hard-light": "hard-light", "soft-light": "soft-light",
  difference: "diff", exclusion: "exclusion",
  hue: "hue", saturation: "saturation", color: "color", luminosity: "luminance"
};

export function parseSvgToVectorProject(svgText: string, inputPath: string, options: SvgParseOptions = {}): SvgParseResult {
  const warnings: ConversionWarning[] = [];
  const parser = new DOMParser({
    errorHandler: {
      warning: () => undefined,
      error: (message) => warnings.push({ code: "SVG_XML_ERROR", message }),
      fatalError: (message) => warnings.push({ code: "SVG_XML_FATAL", message })
    }
  });
  const document = parser.parseFromString(svgText, "image/svg+xml");
  const root = document.documentElement;

  if (!root || root.tagName.toLowerCase() !== "svg") {
    throw new Error("Input is not an SVG document.");
  }

  if (warnings.some((warning) => warning.code === "SVG_XML_FATAL")) {
    throw new Error("SVG XML is malformed and cannot be parsed.");
  }

  const viewport = readViewport(root, warnings, options);
  const gradients = collectGradients(root);
  const cssRules = collectCssRules(root);
  const filters = collectFilters(root);
  const title = options.title ?? (basename(inputPath, extname(inputPath)) || "SML Verter Export");
  const layers: ProjectLayer[] = [];
  const skipped = { count: 0 };
  const initialStyle = readStyle(root, cssRules, {
    fill: "black",
    fillOpacity: 1,
    opacity: 1,
    stroke: undefined,
    strokeWidth: undefined,
    strokeOpacity: 1,
    strokeLinecap: undefined,
    strokeLinejoin: undefined,
    filter: undefined,
    display: undefined,
    visibility: undefined,
    mixBlendMode: undefined
  });

  visitChildren(root, initialStyle, IdentityMatrix, viewport, gradients, filters, cssRules, layers, warnings, skipped, options);

  const project: VectorProject = {
    metadata: {
      title,
      width: viewport.width,
      height: viewport.height,
      fps: DefaultFps,
      totalTime: DefaultDurationMs,
      backgroundColor: "#ffffffff"
    },
    layers,
    warnings,
    skippedElements: skipped.count
  };

  if (layers.length === 0) {
    throw new Error("No supported SVG vector layers were found.");
  }

  return { project };
}

function visitChildren(
  parent: Element,
  style: StyleContext,
  parentMatrix: Matrix,
  viewport: SvgViewport,
  gradients: Map<string, GradientDefinition>,
  filters: Map<string, FilterDefinition>,
  cssRules: Map<string, Record<string, string>>,
  layers: ProjectLayer[],
  warnings: ConversionWarning[],
  skipped: { count: number },
  options: SvgParseOptions
): void {
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    if (options.maxLayers && layers.length >= options.maxLayers) {
      return;
    }

    const child = parent.childNodes.item(index);
    if (child.nodeType !== child.ELEMENT_NODE) {
      continue;
    }

    const element = child as Element;
    const tag = element.tagName.toLowerCase();
    const nextStyle = readStyle(element, cssRules, style);
    const nextMatrix = multiplyMatrices(parentMatrix, parseTransform(element.getAttribute("transform")));

    if (nextStyle.display === "none" || nextStyle.visibility === "hidden") {
      skipped.count += 1;
      continue;
    }

    if (tag === "g" || tag === "svg") {
      visitChildren(element, nextStyle, nextMatrix, viewport, gradients, filters, cssRules, layers, warnings, skipped, options);
      continue;
    }

    if (tag === "style" || tag === "lineargradient" || tag === "filter" || SkipContainerTags.has(tag)) {
      continue;
    }

    if (UnsupportedDrawableTags.has(tag)) {
      skipped.count += 1;
      warnings.push({
        code: "UNSUPPORTED_ELEMENT",
        message: `<${tag}> is not supported yet and was skipped.`
      });
      continue;
    }

    if (tag === "text") {
      const textLayer = createTextLayer(element, nextStyle, layers.length, options, viewport);
      if (textLayer) {
        layers.push(textLayer);
      }
      continue;
    }

    if (tag === "use") {
      const resolved = resolveUseElement(element, parent);
      if (!resolved) {
        skipped.count += 1;
        warnings.push({ code: "UNRESOLVED_USE", message: `<use> reference could not be resolved.` });
        continue;
      }
      const useMatrix = multiplyMatrices(nextMatrix, {
        a: 1, b: 0, c: 0, d: 1,
        e: readNumberAttribute(element, "x", 0),
        f: readNumberAttribute(element, "y", 0)
      });
      const rawPath = elementToPathData(resolved, warnings);
      if (!rawPath) { skipped.count += 1; continue; }
      const pathData = convertPathData(rawPath, viewport, useMatrix, warnings, readLabel(element, layers.length, options));
      if (!pathData) { skipped.count += 1; continue; }
      const useStyle = readStyle(resolved, cssRules, nextStyle);
      layers.push(createLayer(resolved, useStyle, gradients, filters, pathData, layers.length, options, viewport, warnings));
      continue;
    }

    const rawPath = elementToPathData(element, warnings);
    if (!rawPath) {
      skipped.count += 1;
      continue;
    }

    const pathData = convertPathData(rawPath, viewport, nextMatrix, warnings, readLabel(element, layers.length, options));
    if (!pathData) {
      skipped.count += 1;
      continue;
    }

    layers.push(createLayer(element, nextStyle, gradients, filters, pathData, layers.length, options, viewport, warnings));
  }
}

function elementToPathData(element: Element, warnings: ConversionWarning[]): string | undefined {
  const tag = element.tagName.toLowerCase();

  if (tag === "path") {
    return element.getAttribute("d")?.trim() || undefined;
  }

  if (tag === "rect") {
    const width = readNumberAttribute(element, "width", 0);
    const height = readNumberAttribute(element, "height", 0);
    if (width <= 0 || height <= 0) {
      warnings.push({ code: "INVALID_RECT", message: "A <rect> element has non-positive width or height and was skipped." });
      return undefined;
    }

    const x = readNumberAttribute(element, "x", 0);
    const y = readNumberAttribute(element, "y", 0);
    const rx = readNumberAttribute(element, "rx", 0);
    const ry = readNumberAttribute(element, "ry", rx);
    return rectPath(x, y, width, height, rx, ry);
  }

  if (tag === "circle") {
    const cx = readNumberAttribute(element, "cx", 0);
    const cy = readNumberAttribute(element, "cy", 0);
    const radius = readNumberAttribute(element, "r", 0);
    return radius > 0 ? ellipsePath(cx, cy, radius, radius) : undefined;
  }

  if (tag === "ellipse") {
    const cx = readNumberAttribute(element, "cx", 0);
    const cy = readNumberAttribute(element, "cy", 0);
    const rx = readNumberAttribute(element, "rx", 0);
    const ry = readNumberAttribute(element, "ry", 0);
    return rx > 0 && ry > 0 ? ellipsePath(cx, cy, rx, ry) : undefined;
  }

  if (tag === "line") {
    const x1 = readNumberAttribute(element, "x1", 0);
    const y1 = readNumberAttribute(element, "y1", 0);
    const x2 = readNumberAttribute(element, "x2", 0);
    const y2 = readNumberAttribute(element, "y2", 0);
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  if (tag === "polygon" || tag === "polyline") {
    const points = parsePoints(element.getAttribute("points"));
    if (points.length < 2) {
      return undefined;
    }

    const path = [`M ${points[0][0]} ${points[0][1]}`];
    for (let index = 1; index < points.length; index += 1) {
      path.push(`L ${points[index][0]} ${points[index][1]}`);
    }
    if (tag === "polygon") {
      path.push("Z");
    }
    return path.join(" ");
  }

  warnings.push({
    code: "UNKNOWN_ELEMENT",
    message: `<${tag}> is not recognized by the converter and was skipped.`
  });
  return undefined;
}

function convertPathData(pathData: string, viewport: SvgViewport, matrix: Matrix, warnings: ConversionWarning[], label: string): string | undefined {
  try {
    const viewportMatrix = createViewportMatrix(viewport, matrix);
    return new SVGPathData(pathData)
      .toAbs()
      .normalizeHVZ(true, true, true)
      .normalizeST()
      .qtToC()
      .aToC()
      .matrix(viewportMatrix.a, viewportMatrix.b, viewportMatrix.c, viewportMatrix.d, viewportMatrix.e, viewportMatrix.f)
      .round(1000)
      .sanitize(0.00001)
      .encode();
  } catch (error) {
    warnings.push({
      code: "PATH_PARSE_FAILED",
      message: `Path "${label}" could not be converted: ${error instanceof Error ? error.message : String(error)}.`
    });
    return undefined;
  }
}

function createLayer(
  element: Element,
  style: StyleContext,
  gradients: Map<string, GradientDefinition>,
  filters: Map<string, FilterDefinition>,
  pathData: string,
  layerIndex: number,
  options: SvgParseOptions,
  viewport: SvgViewport,
  warnings: ConversionWarning[]
): VectorLayer {
  const opacity = style.opacity * style.fillOpacity;
  const gradient = resolveGradient(style.fill, gradients);
  const solidFill = toAlightArgbColor(style.fill, opacity);
  const strokeColor = toAlightArgbColor(style.stroke, style.opacity * style.strokeOpacity);
  const strokeWidth = style.strokeWidth && style.strokeWidth > 0 ? style.strokeWidth : undefined;
  const fillType = gradient ? "gradient" : solidFill ? "color" : "none";
  const fillColor = solidFill ?? gradient?.startColor ?? strokeColor ?? "#ff000000";
  const stroke = createStroke(style, strokeColor, strokeWidth);
  const effects = resolveFilterEffects(style.filter, filters);
  const blending = style.mixBlendMode ? SvgToAlightBlending[style.mixBlendMode] : undefined;

  if (style.fill?.trim().startsWith("url(") && !gradient) {
    warnings.push({
      code: "UNRESOLVED_GRADIENT",
      message: `Gradient fill on "${readLabel(element, layerIndex, options)}" could not be resolved; emitted Alight Motion gradient fallback.`
    });
  }

  const layerOpacity = style.opacity < 1 ? style.opacity.toFixed(6) : undefined;

  return {
    kind: "shape",
    id: (options.idBase ?? 100_000_000) + layerIndex,
    label: readLabel(element, layerIndex, options),
    pathData,
    fillType: gradient || style.fill?.trim().startsWith("url(") ? "gradient" : fillType,
    fillColor,
    gradient: gradient ?? (style.fill?.trim().startsWith("url(") ? createFallbackGradient(fillColor) : undefined),
    stroke,
    shadow: element.getAttribute("data-am-shadow") === "outside",
    blending,
    effects: effects.length > 0 ? effects : undefined,
    transform: {
      location: `${(viewport.width / 2).toFixed(6)},${(viewport.height / 2).toFixed(6)},0.000000`,
      opacity: layerOpacity
    }
  };
}

function createStroke(style: StyleContext, strokeColor: string | undefined, strokeWidth: number | undefined): StrokeStyle | undefined {
  if (!style.stroke || style.stroke === "none" || !strokeWidth || !strokeColor) {
    return undefined;
  }

  return {
    color: strokeColor,
    width: strokeWidth,
    cap: style.strokeLinecap && style.strokeLinecap !== "butt" ? style.strokeLinecap : undefined,
    join: style.strokeLinejoin && style.strokeLinejoin !== "miter" ? style.strokeLinejoin : undefined
  };
}

function collectGradients(root: Element): Map<string, GradientDefinition> {
  const gradients = new Map<string, GradientDefinition>();
  const nodes = [
    ...Array.from(root.getElementsByTagName("linearGradient")),
    ...Array.from(root.getElementsByTagName("radialGradient"))
  ];

  for (let index = 0; index < nodes.length; index += 1) {
    const gradient = nodes[index];
    if (!gradient) {
      continue;
    }

    const id = gradient.getAttribute("id");
    if (!id) {
      continue;
    }

    const stops = Array.from(gradient.getElementsByTagName("stop"));
    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1] ?? firstStop;
    const startColor = readStopColor(firstStop) ?? "#ff000000";
    const endColor = readStopColor(lastStop) ?? startColor;
    gradients.set(id, {
      id,
      type: gradient.tagName.toLowerCase() === "radialgradient" ? "radial" : "linear",
      startColor,
      endColor,
      start: readGradientPoint(gradient, gradient.tagName.toLowerCase() === "radialgradient" ? "cx" : "x1", gradient.tagName.toLowerCase() === "radialgradient" ? "cy" : "y1", "0.000000,0.000000"),
      end: readGradientPoint(gradient, "x2", "y2", "1.000000,1.000000")
    });
  }

  return gradients;
}

function resolveGradient(fill: string | undefined, gradients: Map<string, GradientDefinition>): GradientStyle | undefined {
  if (!fill) {
    return undefined;
  }

  const match = fill.match(/^url\(#([^)]+)\)$/u);
  if (!match) {
    return undefined;
  }

  const gradient = gradients.get(match[1]);
  if (!gradient) {
    return undefined;
  }

  return {
    type: gradient.type,
    startColor: gradient.startColor,
    endColor: gradient.endColor,
    start: gradient.start,
    end: gradient.end
  };
}

function createFallbackGradient(color: string): GradientStyle {
  return {
    type: "linear",
    startColor: color,
    endColor: "#ffffffff",
    start: "0.000000,0.000000",
    end: "1.000000,1.000000"
  };
}

function readStopColor(stop: Element | undefined): string | undefined {
  if (!stop) {
    return undefined;
  }

  const inline = parseStyleAttribute(stop.getAttribute("style"));
  const color = stop.getAttribute("stop-color") ?? inline["stop-color"];
  const opacity = Number.parseFloat(stop.getAttribute("stop-opacity") ?? inline["stop-opacity"] ?? "1");
  return toAlightArgbColor(color, Number.isFinite(opacity) ? opacity : 1);
}

function readGradientPoint(gradient: Element, xName: string, yName: string, fallback: string): string {
  const x = parseGradientCoordinate(gradient.getAttribute(xName));
  const y = parseGradientCoordinate(gradient.getAttribute(yName));
  return x === undefined || y === undefined ? fallback : `${x.toFixed(6)},${y.toFixed(6)}`;
}

function parseGradientCoordinate(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  if (value.endsWith("%")) {
    return Number.parseFloat(value) / 100;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const MinSceneSize = 1080;

function readViewport(root: Element, warnings: ConversionWarning[], options: SvgParseOptions): SvgViewport {
  const viewBox = parseViewBox(root.getAttribute("viewBox"));
  const sourceWidth = readDimension(root.getAttribute("width")) ?? viewBox?.width ?? DefaultSceneWidth;
  const sourceHeight = readDimension(root.getAttribute("height")) ?? viewBox?.height ?? DefaultSceneHeight;

  let width = options.sceneWidth ?? sourceWidth;
  let height = options.sceneHeight ?? sourceHeight;

  if (!options.sceneWidth && !options.sceneHeight) {
    const longest = Math.max(width, height);
    if (longest < MinSceneSize) {
      const scale = MinSceneSize / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    width = Math.round(width);
    height = Math.round(height);
  }

  if ((!root.getAttribute("width") || !root.getAttribute("height")) && !viewBox) {
    warnings.push({
      code: "VIEWPORT_DEFAULT",
      message: `SVG width or height is missing; using ${width}x${height}.`
    });
  }

  return {
    width,
    height,
    viewBoxMinX: viewBox?.minX ?? 0,
    viewBoxMinY: viewBox?.minY ?? 0,
    viewBoxWidth: viewBox?.width ?? sourceWidth,
    viewBoxHeight: viewBox?.height ?? sourceHeight
  };
}

function parseViewBox(value: string | null): { minX: number; minY: number; width: number; height: number } | undefined {
  if (!value) {
    return undefined;
  }

  const parts = value.trim().split(/[\s,]+/u).map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part)) || parts[2] <= 0 || parts[3] <= 0) {
    return undefined;
  }

  return {
    minX: parts[0],
    minY: parts[1],
    width: parts[2],
    height: parts[3]
  };
}

function createViewportMatrix(viewport: SvgViewport, matrix: Matrix): Matrix {
  const scaleX = viewport.width / viewport.viewBoxWidth;
  const scaleY = viewport.height / viewport.viewBoxHeight;
  return {
    a: matrix.a * scaleX,
    b: matrix.b * scaleY,
    c: matrix.c * scaleX,
    d: matrix.d * scaleY,
    e: (matrix.e - viewport.viewBoxMinX) * scaleX - viewport.width / 2,
    f: (matrix.f - viewport.viewBoxMinY) * scaleY - viewport.height / 2
  };
}

function readStyle(element: Element, cssRules: Map<string, Record<string, string>>, inherited: StyleContext): StyleContext {
  const inline = parseStyleAttribute(element.getAttribute("style"));
  const classNames = (element.getAttribute("class") || "").split(/\s+/u).filter(Boolean);
  const classStyles: Record<string, string> = {};
  for (const cls of classNames) {
    const rule = cssRules.get(cls);
    if (rule) {
      Object.assign(classStyles, rule);
    }
  }
  const merged = { ...classStyles, ...inline };
  return {
    fill: readStringStyle(element, merged, "fill", inherited.fill),
    fillOpacity: readNumberStyle(element, merged, "fill-opacity", inherited.fillOpacity),
    opacity: readNumberStyle(element, merged, "opacity", inherited.opacity),
    stroke: readStringStyle(element, merged, "stroke", inherited.stroke),
    strokeWidth: readNumberStyle(element, merged, "stroke-width", inherited.strokeWidth),
    strokeOpacity: readNumberStyle(element, merged, "stroke-opacity", inherited.strokeOpacity),
    strokeLinecap: readStringStyle(element, merged, "stroke-linecap", inherited.strokeLinecap),
    strokeLinejoin: readStringStyle(element, merged, "stroke-linejoin", inherited.strokeLinejoin),
    filter: readStringStyle(element, merged, "filter", inherited.filter),
    display: readStringStyle(element, merged, "display", inherited.display),
    visibility: readStringStyle(element, merged, "visibility", inherited.visibility),
    mixBlendMode: readStringStyle(element, merged, "mix-blend-mode", inherited.mixBlendMode)
  };
}

function parseStyleAttribute(value: string | null): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf(":");
        if (separatorIndex === -1) {
          return [part, ""];
        }
        return [part.slice(0, separatorIndex).trim(), part.slice(separatorIndex + 1).trim()];
      })
  );
}

function readStringStyle(element: Element, inline: Record<string, string>, name: string, fallback: string | undefined): string | undefined {
  // Note: @xmldom/xmldom returns "" instead of null for missing attributes,
  // so we must treat empty strings as absent to allow inheritance fallback.
  return element.getAttribute(name) || inline[name] || fallback;
}

function readNumberStyle(element: Element, inline: Record<string, string>, name: string, fallback: number | undefined): number {
  const raw = element.getAttribute(name) || inline[name];
  if (!raw) {
    return fallback ?? 1;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback ?? 1;
}

function readNumberAttribute(element: Element, name: string, fallback: number): number {
  const raw = element.getAttribute(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const UnitConversion: Record<string, number> = {
  px: 1, "": 1,
  mm: 3.7795275591,
  cm: 37.795275591,
  in: 96,
  pt: 1.3333333333,
  pc: 16
};

function readDimension(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.trim().match(/^([\d.]+)\s*(mm|cm|in|pt|pc|px)?$/u);
  if (!match) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  const num = Number.parseFloat(match[1]);
  const unit = match[2] ?? "";
  const multiplier = UnitConversion[unit] ?? 1;
  const result = num * multiplier;
  return Number.isFinite(result) && result > 0 ? result : undefined;
}

function readLabel(element: Element, layerIndex: number, options: SvgParseOptions): string {
  const baseLabel = element.getAttribute("id") || element.getAttribute("aria-label") || `${element.tagName} ${layerIndex + 1}`;
  return options.labelPrefix ? `${options.labelPrefix} ${baseLabel}` : baseLabel;
}


function parsePoints(value: string | null): Array<[number, number]> {
  if (!value) {
    return [];
  }

  const numbers = value.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/gu)?.map(Number) ?? [];
  const points: Array<[number, number]> = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push([numbers[index], numbers[index + 1]]);
  }
  return points;
}

function rectPath(x: number, y: number, width: number, height: number, radiusX: number, radiusY: number): string {
  const rx = Math.min(Math.max(0, radiusX), width / 2);
  const ry = Math.min(Math.max(0, radiusY), height / 2);

  if (rx === 0 && ry === 0) {
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }

  const c = 0.5522847498307936;
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

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
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

function parseTransform(value: string | null): Matrix {
  if (!value) {
    return IdentityMatrix;
  }

  let matrix = IdentityMatrix;
  const matches = value.matchAll(/(matrix|translate|scale|rotate|skewX|skewY)\(([^)]*)\)/gu);
  for (const match of matches) {
    const name = match[1];
    const numbers = match[2].split(/[\s,]+/u).filter(Boolean).map(Number);
    matrix = multiplyMatrices(matrix, transformToMatrix(name, numbers));
  }

  return matrix;
}

function transformToMatrix(name: string, numbers: number[]): Matrix {
  switch (name) {
    case "matrix":
      return numbers.length >= 6 ? { a: numbers[0], b: numbers[1], c: numbers[2], d: numbers[3], e: numbers[4], f: numbers[5] } : IdentityMatrix;
    case "translate":
      return { a: 1, b: 0, c: 0, d: 1, e: numbers[0] ?? 0, f: numbers[1] ?? 0 };
    case "scale":
      return { a: numbers[0] ?? 1, b: 0, c: 0, d: numbers[1] ?? numbers[0] ?? 1, e: 0, f: 0 };
    case "rotate": {
      const angle = ((numbers[0] ?? 0) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotation = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
      if (numbers.length >= 3) {
        return multiplyMatrices(multiplyMatrices({ a: 1, b: 0, c: 0, d: 1, e: numbers[1], f: numbers[2] }, rotation), { a: 1, b: 0, c: 0, d: 1, e: -numbers[1], f: -numbers[2] });
      }
      return rotation;
    }
    case "skewX": {
      const angle = ((numbers[0] ?? 0) * Math.PI) / 180;
      return { a: 1, b: 0, c: Math.tan(angle), d: 1, e: 0, f: 0 };
    }
    case "skewY": {
      const angle = ((numbers[0] ?? 0) * Math.PI) / 180;
      return { a: 1, b: Math.tan(angle), c: 0, d: 1, e: 0, f: 0 };
    }
    default:
      return IdentityMatrix;
  }
}

function multiplyMatrices(left: Matrix, right: Matrix): Matrix {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f
  };
}

function collectCssRules(root: Element): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  const styleElements = root.getElementsByTagName("style");
  for (let i = 0; i < styleElements.length; i += 1) {
    const text = styleElements[i]?.textContent ?? "";
    const rulePattern = /\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/gu;
    let match: RegExpExecArray | null;
    while ((match = rulePattern.exec(text)) !== null) {
      rules.set(match[1], parseStyleAttribute(match[2]));
    }
  }
  return rules;
}

function collectFilters(root: Element): Map<string, FilterDefinition> {
  const filters = new Map<string, FilterDefinition>();
  const filterElements = root.getElementsByTagName("filter");
  for (let i = 0; i < filterElements.length; i += 1) {
    const filterEl = filterElements[i];
    if (!filterEl) { continue; }
    const id = filterEl.getAttribute("id");
    if (!id) { continue; }
    const blurs = filterEl.getElementsByTagName("feGaussianBlur");
    if (blurs.length > 0) {
      const stdDev = Number.parseFloat(blurs[0]?.getAttribute("stdDeviation") ?? "0");
      if (Number.isFinite(stdDev) && stdDev > 0) {
        filters.set(id, { id, type: "gaussianBlur", stdDeviation: stdDev });
      }
    }
  }
  return filters;
}

function resolveFilterEffects(filter: string | undefined, filters: Map<string, FilterDefinition>): EffectDefinition[] {
  if (!filter) { return []; }
  const match = filter.match(/^url\(#([^)]+)\)$/u);
  if (!match) { return []; }
  const def = filters.get(match[1]);
  if (!def) { return []; }
  if (def.type === "gaussianBlur") {
    const strength = Math.min(2, def.stdDeviation / 5);
    return [{
      id: "com.alightcreative.effects.gaussianblur",
      locallyApplied: true,
      properties: [{ name: "strength", type: "float", value: strength.toFixed(6) }]
    }];
  }
  return [];
}

function resolveUseElement(useElement: Element, parent: Element): Element | undefined {
  const href = useElement.getAttribute("href") || useElement.getAttribute("xlink:href");
  if (!href || !href.startsWith("#")) { return undefined; }
  const targetId = href.slice(1);
  const root = useElement.ownerDocument?.documentElement;
  if (!root) { return undefined; }
  return findElementById(root, targetId);
}

function findElementById(parent: Element, id: string): Element | undefined {
  if (parent.getAttribute("id") === id) { return parent; }
  for (let i = 0; i < parent.childNodes.length; i += 1) {
    const child = parent.childNodes.item(i);
    if (child.nodeType === child.ELEMENT_NODE) {
      const found = findElementById(child as Element, id);
      if (found) { return found; }
    }
  }
  return undefined;
}

function createTextLayer(
  element: Element,
  style: StyleContext,
  layerIndex: number,
  options: SvgParseOptions,
  viewport: SvgViewport
): TextLayer | undefined {
  const content = (element.textContent ?? "").trim();
  if (!content) { return undefined; }

  const inline = parseStyleAttribute(element.getAttribute("style"));
  const fontSizeRaw = element.getAttribute("font-size") || inline["font-size"] || "18";
  const fontSize = Number.parseFloat(fontSizeRaw);
  const anchor = element.getAttribute("text-anchor") || inline["text-anchor"] || "start";
  const align = anchor === "middle" ? "center" as const : anchor === "end" ? "right" as const : "left" as const;
  const opacity = style.opacity * style.fillOpacity;
  const fillColor = toAlightArgbColor(style.fill, opacity) ?? "#ff000000";
  const blending = style.mixBlendMode ? SvgToAlightBlending[style.mixBlendMode] : undefined;

  return {
    kind: "text",
    id: (options.idBase ?? 100_000_000) + layerIndex,
    label: readLabel(element, layerIndex, options),
    content,
    fontSize: Number.isFinite(fontSize) ? fontSize : 18,
    fontFamily: "Roboto",
    fontWeight: 400,
    align,
    wrapWidth: 512,
    fillType: "color",
    fillColor,
    blending,
    transform: {
      location: `${(viewport.width / 2).toFixed(6)},${(viewport.height / 2).toFixed(6)},0.000000`
    }
  };
}
