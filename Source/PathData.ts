// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

import { formatPathNumber } from "./XmlUtilities.js";

export interface PointMapper {
  (x: number, y: number): [number, number];
}

interface PathState {
  index: number;
  command: string | undefined;
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
}

const CommandPattern = /^[AaCcHhLlMmQqSsTtVvZz]$/;
const SupportedCommands = new Set(["M", "m", "L", "l", "H", "h", "V", "v", "C", "c", "Z", "z"]);

export function convertSvgPathData(pathData: string, mapPoint: PointMapper): { pathData: string; unsupportedCommands: string[] } {
  const tokens = tokenizePath(pathData);
  const state: PathState = {
    index: 0,
    command: undefined,
    currentX: 0,
    currentY: 0,
    startX: 0,
    startY: 0
  };
  const output: string[] = [];
  const unsupportedCommands = new Set<string>();

  while (state.index < tokens.length) {
    const token = tokens[state.index];
    if (isCommand(token)) {
      state.command = token;
      state.index += 1;
    }

    if (!state.command) {
      throw new Error("SVG path data begins without a command.");
    }

    if (!SupportedCommands.has(state.command)) {
      unsupportedCommands.add(state.command.toUpperCase());
      skipUnsupportedCommand(tokens, state);
      continue;
    }

    switch (state.command) {
      case "M":
      case "m":
        readMove(tokens, state, output, mapPoint);
        break;
      case "L":
      case "l":
        readLine(tokens, state, output, mapPoint);
        break;
      case "H":
      case "h":
        readHorizontal(tokens, state, output, mapPoint);
        break;
      case "V":
      case "v":
        readVertical(tokens, state, output, mapPoint);
        break;
      case "C":
      case "c":
        readCubic(tokens, state, output, mapPoint);
        break;
      case "Z":
      case "z":
        output.push("Z");
        state.currentX = state.startX;
        state.currentY = state.startY;
        state.command = undefined;
        break;
      default:
        throw new Error(`Unsupported SVG path command: ${state.command}`);
    }
  }

  return {
    pathData: output.join(""),
    unsupportedCommands: [...unsupportedCommands].sort()
  };
}

export function rectToPathData(x: number, y: number, width: number, height: number, radiusX: number, radiusY: number, mapPoint: PointMapper): string {
  if (width <= 0 || height <= 0) {
    throw new Error("SVG rectangle width and height must be positive.");
  }

  const rx = Math.min(Math.max(0, radiusX), width / 2);
  const ry = Math.min(Math.max(0, radiusY), height / 2);

  if (rx === 0 && ry === 0) {
    return [
      moveTo(...mapPoint(x, y)),
      lineTo(...mapPoint(x + width, y)),
      lineTo(...mapPoint(x + width, y + height)),
      lineTo(...mapPoint(x, y + height)),
      "Z"
    ].join("");
  }

  const c = 0.5522847498307936;
  return [
    moveTo(...mapPoint(x + rx, y)),
    lineTo(...mapPoint(x + width - rx, y)),
    cubicTo(
      ...mapPoint(x + width - rx + rx * c, y),
      ...mapPoint(x + width, y + ry - ry * c),
      ...mapPoint(x + width, y + ry)
    ),
    lineTo(...mapPoint(x + width, y + height - ry)),
    cubicTo(
      ...mapPoint(x + width, y + height - ry + ry * c),
      ...mapPoint(x + width - rx + rx * c, y + height),
      ...mapPoint(x + width - rx, y + height)
    ),
    lineTo(...mapPoint(x + rx, y + height)),
    cubicTo(
      ...mapPoint(x + rx - rx * c, y + height),
      ...mapPoint(x, y + height - ry + ry * c),
      ...mapPoint(x, y + height - ry)
    ),
    lineTo(...mapPoint(x, y + ry)),
    cubicTo(
      ...mapPoint(x, y + ry - ry * c),
      ...mapPoint(x + rx - rx * c, y),
      ...mapPoint(x + rx, y)
    ),
    "Z"
  ].join("");
}

function tokenizePath(pathData: string): string[] {
  return pathData.match(/[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
}

function readMove(tokens: string[], state: PathState, output: string[], mapPoint: PointMapper): void {
  const isRelative = state.command === "m";
  let first = true;

  while (hasNumber(tokens, state.index)) {
    const [x, y] = readPoint(tokens, state, isRelative);
    if (first) {
      state.startX = x;
      state.startY = y;
      output.push(moveTo(...mapPoint(x, y)));
      first = false;
    } else {
      output.push(lineTo(...mapPoint(x, y)));
    }
    state.currentX = x;
    state.currentY = y;
  }

  state.command = isRelative ? "l" : "L";
}

function readLine(tokens: string[], state: PathState, output: string[], mapPoint: PointMapper): void {
  const isRelative = state.command === "l";
  while (hasNumber(tokens, state.index)) {
    const [x, y] = readPoint(tokens, state, isRelative);
    output.push(lineTo(...mapPoint(x, y)));
    state.currentX = x;
    state.currentY = y;
  }
}

function readHorizontal(tokens: string[], state: PathState, output: string[], mapPoint: PointMapper): void {
  const isRelative = state.command === "h";
  while (hasNumber(tokens, state.index)) {
    const nextX = readNumber(tokens, state);
    const x = isRelative ? state.currentX + nextX : nextX;
    state.currentX = x;
    output.push(lineTo(...mapPoint(state.currentX, state.currentY)));
  }
}

function readVertical(tokens: string[], state: PathState, output: string[], mapPoint: PointMapper): void {
  const isRelative = state.command === "v";
  while (hasNumber(tokens, state.index)) {
    const nextY = readNumber(tokens, state);
    const y = isRelative ? state.currentY + nextY : nextY;
    state.currentY = y;
    output.push(lineTo(...mapPoint(state.currentX, state.currentY)));
  }
}

function readCubic(tokens: string[], state: PathState, output: string[], mapPoint: PointMapper): void {
  const isRelative = state.command === "c";
  while (hasNumber(tokens, state.index)) {
    const [x1, y1] = readPoint(tokens, state, isRelative);
    const [x2, y2] = readPoint(tokens, state, isRelative);
    const [x, y] = readPoint(tokens, state, isRelative);
    output.push(cubicTo(...mapPoint(x1, y1), ...mapPoint(x2, y2), ...mapPoint(x, y)));
    state.currentX = x;
    state.currentY = y;
  }
}

function readPoint(tokens: string[], state: PathState, isRelative: boolean): [number, number] {
  const x = readNumber(tokens, state);
  const y = readNumber(tokens, state);
  return isRelative ? [state.currentX + x, state.currentY + y] : [x, y];
}

function readNumber(tokens: string[], state: PathState): number {
  const token = tokens[state.index];
  if (!hasNumber(tokens, state.index)) {
    throw new Error(`Expected SVG path number at token ${state.index}.`);
  }

  state.index += 1;
  return Number(token);
}

function skipUnsupportedCommand(tokens: string[], state: PathState): void {
  while (state.index < tokens.length && !isCommand(tokens[state.index])) {
    state.index += 1;
  }
  state.command = undefined;
}

function hasNumber(tokens: string[], index: number): boolean {
  return index < tokens.length && !isCommand(tokens[index]);
}

function isCommand(token: string): boolean {
  return CommandPattern.test(token);
}

function moveTo(x: number, y: number): string {
  return `M ${formatPathNumber(x)} ${formatPathNumber(y)}`;
}

function lineTo(x: number, y: number): string {
  return `L ${formatPathNumber(x)} ${formatPathNumber(y)}`;
}

function cubicTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): string {
  return `C ${formatPathNumber(x1)} ${formatPathNumber(y1)}, ${formatPathNumber(x2)} ${formatPathNumber(y2)}, ${formatPathNumber(x)} ${formatPathNumber(y)}`;
}
