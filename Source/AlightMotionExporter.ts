// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import type { EffectDefinition, GroupLayer, LayerTransform, ProjectLayer, TextLayer, VectorLayer, VectorProject } from "./Types.js";
import { escapeXmlAttribute, formatNumber } from "./XmlUtilities.js";

const AlightMotionVersion = "com.alightcreative.motion/5.0.273.1028425";
const AlightMotionVersionCode = "1028425";
const FileFormatVersion = "106";

export function exportAlightMotionXml(project: VectorProject): string {
  const scene = project.metadata;
  const lines: string[] = [
    "<?xml version='1.0' encoding='UTF-8' ?>",
    `<!--`,
    `Created by SML Verter`,
    `Based on observed Alight Motion XML export structure`,
    `-->`,
    renderSceneOpen(
      escapeXmlAttribute(scene.title),
      scene.width,
      scene.height,
      scene.backgroundColor,
      scene.totalTime,
      scene.fps,
      "freeze"
    )
  ];

  for (const layer of project.layers) {
    lines.push(...renderLayer(layer, scene.width / 2, scene.height / 2, scene.totalTime, 1));
  }

  lines.push("</scene>");
  return `${lines.join("\n")}\n`;
}

function renderLayer(layer: ProjectLayer, centerX: number, centerY: number, totalTime: number, indentLevel: number): string[] {
  if (layer.kind === "group") {
    return renderGroupLayer(layer, centerX, centerY, totalTime, indentLevel);
  }
  if (layer.kind === "text") {
    return renderTextLayer(layer, centerX, centerY, totalTime, indentLevel);
  }
  return renderShapeLayer(layer, centerX, centerY, totalTime, indentLevel);
}

function renderShapeLayer(layer: VectorLayer, centerX: number, centerY: number, totalTime: number, indentLevel: number): string[] {
  const indent = "  ".repeat(indentLevel);
  const childIndent = "  ".repeat(indentLevel + 1);
  const attributes = [
    `id="${layer.id}"`,
    `label="${escapeXmlAttribute(layer.label)}"`,
    layer.hidden ? `hidden="true"` : undefined,
    `startTime="${formatWholeNumber(layer.startTime ?? 0)}"`,
    `endTime="${formatWholeNumber(layer.endTime ?? totalTime)}"`,
    layer.clippingMask ? `clippingMask="true"` : undefined,
    `fillType="${layer.fillType}"`,
    layer.blending && layer.blending !== "normal" ? `blending="${layer.blending}"` : undefined,
    `mediaFillMode="fill"`
  ].filter(Boolean);
  const lines = [
    `${indent}<shape ${attributes.join(" ")}>`
  ];

  lines.push(...renderTransform(layer.transform, centerX, centerY, indentLevel + 1));

  if (layer.fillColor && layer.fillType !== "gradient") {
    lines.push(`${childIndent}<fillColor value="${layer.fillColor}" />`);
  } else if (layer.fillColor && layer.gradient) {
    lines.push(`${childIndent}<fillColor value="${layer.fillColor}" />`);
  }

  if (layer.gradient) {
    lines.push(`${childIndent}<gradient type="${layer.gradient.type}" startColor="${layer.gradient.startColor}" endColor="${layer.gradient.endColor}" start="${layer.gradient.start}" end="${layer.gradient.end}" />`);
  }

  if (layer.shadow) {
    lines.push(`${childIndent}<shadow direction="outside" />`);
  }

  if (layer.borderDirection) {
    lines.push(`${childIndent}<border direction="${layer.borderDirection}" id="1" />`);
  }

  if (layer.stroke) {
    const strokeAttributes = [
      `direction="centered"`,
      layer.stroke.cap ? `cap="${layer.stroke.cap}"` : undefined,
      layer.stroke.join ? `join="${layer.stroke.join}"` : undefined,
      `end-size="1.500000"`
    ].filter(Boolean);
    lines.push(`${childIndent}<path-stroke ${strokeAttributes.join(" ")}>`);
    lines.push(`${childIndent}  <size value="${formatNumber(layer.stroke.width)}" />`);
    lines.push(`${childIndent}</path-stroke>`);
  }

  lines.push(...renderEffects(layer.effects, childIndent));
  lines.push(...renderPathContours(layer.pathData, childIndent));
  lines.push(`${indent}</shape>`);
  return lines;
}

function splitSubpaths(pathData: string): string[] {
  const subpaths: string[] = [];
  const cleaned = pathData.trim();
  if (!cleaned) {
    return subpaths;
  }

  const parts = cleaned.split(/(?=M)/u);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      subpaths.push(trimmed);
    }
  }
  return subpaths;
}

function computeSignedArea(d: string): number {
  const coords: [number, number][] = [];
  const re = /(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d)) !== null) {
    coords.push([Number.parseFloat(match[1]), Number.parseFloat(match[2])]);
  }
  let area = 0;
  for (let i = 0; i < coords.length; i += 1) {
    const j = (i + 1) % coords.length;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  return area / 2;
}

function renderPathContours(pathData: string, indent: string): string[] {
  const subpaths = splitSubpaths(pathData);
  if (subpaths.length <= 1) {
    return [`${indent}<path d="${escapeXmlAttribute(pathData)}" />`];
  }

  const lines: string[] = [];
  const mainArea = computeSignedArea(subpaths[0]);
  const mainSign = mainArea >= 0;

  lines.push(`${indent}<path>`);
  for (let i = 0; i < subpaths.length; i += 1) {
    const area = i === 0 ? mainArea : computeSignedArea(subpaths[i]);
    const sign = area >= 0;
    const isHole = i > 0 && sign !== mainSign;
    const attrs = isHole
      ? ` exclude="true" d="${escapeXmlAttribute(subpaths[i])}"`
      : ` d="${escapeXmlAttribute(subpaths[i])}"`;
    lines.push(`${indent}  <contour${attrs} />`);
  }
  lines.push(`${indent}</path>`);
  return lines;
}

function renderGroupLayer(layer: GroupLayer, centerX: number, centerY: number, totalTime: number, indentLevel: number): string[] {
  const indent = "  ".repeat(indentLevel);
  const childIndent = "  ".repeat(indentLevel + 1);
  const groupWidth = layer.width ?? centerX * 2;
  const groupHeight = layer.height ?? centerY * 2;
  const groupTime = layer.totalTime ?? totalTime;
  const attributes = [
    `id="${layer.id}"`,
    `label="${escapeXmlAttribute(layer.label)}"`,
    `startTime="${formatWholeNumber(layer.startTime ?? 0)}"`,
    `endTime="${formatWholeNumber(layer.endTime ?? totalTime)}"`,
    typeof layer.outTime === "number" ? `outTime="${formatWholeNumber(layer.outTime)}"` : undefined,
    `fillType="intrinsic"`,
    `mediaFillMode="fill"`
  ].filter(Boolean);
  const lines = [
    `${indent}<embedScene ${attributes.join(" ")}>`
  ];

  lines.push(...renderTransform(layer.transform, centerX, centerY, indentLevel + 1));
  lines.push(`${childIndent}<fillColor value="#ff000000" />`);
  lines.push(`${childIndent}${renderSceneOpen("", groupWidth, groupHeight, "#00000000", groupTime, 24, "off")}`);

  for (const child of layer.layers) {
    lines.push(...renderLayer(child, groupWidth / 2, groupHeight / 2, groupTime, indentLevel + 2));
  }

  lines.push(`${childIndent}</scene>`);
  lines.push(`${indent}</embedScene>`);
  return lines;
}

function renderTransform(transform: LayerTransform | undefined, centerX: number, centerY: number, indentLevel: number): string[] {
  const indent = "  ".repeat(indentLevel);
  const location = transform?.location ?? `${formatNumber(centerX)},${formatNumber(centerY)},0.000000`;
  const lines = [
    `${indent}<transform>`,
    `${indent}  <location value="${location}" />`
  ];

  if (transform?.pivot) {
    lines.push(`${indent}  <pivot value="${transform.pivot}" />`);
  }

  if (transform?.scale) {
    lines.push(`${indent}  <scale value="${transform.scale}" />`);
  }

  if (transform?.rotation) {
    lines.push(`${indent}  <rotation value="${transform.rotation}" />`);
  }

  if (transform?.opacity) {
    lines.push(`${indent}  <opacity value="${transform.opacity}" />`);
  }

  lines.push(`${indent}</transform>`);
  return lines;
}

function renderSceneOpen(title: string, width: number, height: number, backgroundColor: string, totalTime: number, fps: number, retime: "freeze" | "off"): string {
  return `<scene title="${title}" width="${formatWholeNumber(width)}" height="${formatWholeNumber(height)}" exportWidth="${formatWholeNumber(width)}" exportHeight="${formatWholeNumber(height)}" precompose="dynamicResolution" bgcolor="${backgroundColor}" totalTime="${formatWholeNumber(totalTime)}" fps="${formatWholeNumber(fps)}" modifiedTime="0" amver="${AlightMotionVersionCode}" ffver="${FileFormatVersion}" am="${AlightMotionVersion}" amplatform="android" retime="${retime}" retimeAdaptFPS="false">`;
}

function formatWholeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot format non-finite whole number: ${value}`);
  }

  return `${Math.round(value)}`;
}

function renderTextLayer(layer: TextLayer, centerX: number, centerY: number, totalTime: number, indentLevel: number): string[] {
  const indent = "  ".repeat(indentLevel);
  const childIndent = "  ".repeat(indentLevel + 1);
  const fontRef = `googlefonts?name=${escapeXmlAttribute(layer.fontFamily)}&amp;weight=${layer.fontWeight}`;
  const attributes = [
    `id="${layer.id}"`,
    layer.label ? `label="${escapeXmlAttribute(layer.label)}"` : undefined,
    layer.hidden ? `hidden="true"` : undefined,
    `startTime="${formatWholeNumber(layer.startTime ?? 0)}"`,
    `endTime="${formatWholeNumber(layer.endTime ?? totalTime)}"`,
    `fillType="${layer.fillType}"`,
    layer.blending && layer.blending !== "normal" ? `blending="${layer.blending}"` : undefined,
    `mediaFillMode="fill"`,
    `size="${formatNumber(layer.fontSize)}"`,
    `font="${fontRef}"`,
    `wrapWidth="${formatWholeNumber(layer.wrapWidth)}"`,
    `align="${layer.align}"`
  ].filter(Boolean);
  const lines = [
    `${indent}<text ${attributes.join(" ")}>`
  ];

  lines.push(...renderTransform(layer.transform, centerX, centerY, indentLevel + 1));
  lines.push(`${childIndent}<fillColor value="${layer.fillColor}" />`);
  lines.push(...renderEffects(layer.effects, childIndent));
  lines.push(`${childIndent}<content>${escapeXmlAttribute(layer.content)}</content>`);
  lines.push(`${indent}</text>`);
  return lines;
}

function renderEffects(effects: EffectDefinition[] | undefined, indent: string): string[] {
  if (!effects || effects.length === 0) { return []; }
  const lines: string[] = [];
  for (const effect of effects) {
    const attrs = [
      `id="${effect.id}"`,
      effect.hidden ? `hidden="true"` : undefined,
      effect.locallyApplied ? `locallyApplied="true"` : undefined
    ].filter(Boolean);
    lines.push(`${indent}<effect ${attrs.join(" ")}>`);
    for (const prop of effect.properties) {
      lines.push(`${indent}  <property name="${prop.name}" type="${prop.type}" value="${prop.value}" />`);
    }
    lines.push(`${indent}</effect>`);
  }
  return lines;
}
