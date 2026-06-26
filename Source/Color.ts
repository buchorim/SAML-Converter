// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

const NamedColors: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  transparent: "#00000000",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32"
};

export function toAlightArgbColor(value: string | undefined, opacity = 1): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleanValue = value.trim().toLowerCase();
  if (cleanValue === "none" || cleanValue.startsWith("url(")) {
    return undefined;
  }

  const normalized = NamedColors[cleanValue] ?? cleanValue;
  const hex = parseHexColor(normalized) ?? parseRgbColor(normalized) ?? parseHslColor(normalized);
  if (!hex) {
    return undefined;
  }

  const alpha = Math.round(hex.alpha * clampOpacity(opacity));
  return `#${toHexByte(alpha)}${toHexByte(hex.red)}${toHexByte(hex.green)}${toHexByte(hex.blue)}`;
}

interface ParsedColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

function parseRgbColor(value: string): ParsedColor | undefined {
  const match = value.match(/^rgba?\(([^)]+)\)$/u);
  if (!match) {
    return undefined;
  }

  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) {
    return undefined;
  }

  const red = parseColorComponent(parts[0]);
  const green = parseColorComponent(parts[1]);
  const blue = parseColorComponent(parts[2]);
  const alpha = parts[3] ? Math.round(clampOpacity(Number.parseFloat(parts[3])) * 255) : 255;

  if ([red, green, blue, alpha].some((part) => !Number.isFinite(part))) {
    return undefined;
  }

  return { red, green, blue, alpha };
}

function parseHslColor(value: string): ParsedColor | undefined {
  const match = value.match(/^hsla?\(([^)]+)\)$/u);
  if (!match) {
    return undefined;
  }

  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) {
    return undefined;
  }

  const hue = Number.parseFloat(parts[0]) % 360;
  const saturation = parsePercentage(parts[1]);
  const lightness = parsePercentage(parts[2]);
  const alpha = parts[3] ? Math.round(clampOpacity(Number.parseFloat(parts[3])) * 255) : 255;

  if ([hue, saturation, lightness, alpha].some((v) => !Number.isFinite(v))) {
    return undefined;
  }

  const { red, green, blue } = hslToRgb(hue < 0 ? hue + 360 : hue, saturation, lightness);
  return { red, green, blue, alpha };
}

function hslToRgb(hue: number, saturation: number, lightness: number): { red: number; green: number; blue: number } {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c; g = x; b = 0;
  } else if (hue < 120) {
    r = x; g = c; b = 0;
  } else if (hue < 180) {
    r = 0; g = c; b = x;
  } else if (hue < 240) {
    r = 0; g = x; b = c;
  } else if (hue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    red: Math.round((r + m) * 255),
    green: Math.round((g + m) * 255),
    blue: Math.round((b + m) * 255)
  };
}

function parsePercentage(value: string): number {
  return Number.parseFloat(value.replace("%", ""));
}

function parseColorComponent(value: string): number {
  if (value.endsWith("%")) {
    return Math.round((Number.parseFloat(value) / 100) * 255);
  }

  return Math.min(255, Math.max(0, Math.round(Number.parseFloat(value))));
}

function parseHexColor(value: string): ParsedColor | undefined {
  if (!value.startsWith("#")) {
    return undefined;
  }

  const raw = value.slice(1);
  if (raw.length === 3) {
    return {
      red: parseInt(raw[0] + raw[0], 16),
      green: parseInt(raw[1] + raw[1], 16),
      blue: parseInt(raw[2] + raw[2], 16),
      alpha: 255
    };
  }

  if (raw.length === 4) {
    return {
      red: parseInt(raw[0] + raw[0], 16),
      green: parseInt(raw[1] + raw[1], 16),
      blue: parseInt(raw[2] + raw[2], 16),
      alpha: parseInt(raw[3] + raw[3], 16)
    };
  }

  if (raw.length === 6) {
    return {
      red: parseInt(raw.slice(0, 2), 16),
      green: parseInt(raw.slice(2, 4), 16),
      blue: parseInt(raw.slice(4, 6), 16),
      alpha: 255
    };
  }

  if (raw.length === 8) {
    return {
      red: parseInt(raw.slice(0, 2), 16),
      green: parseInt(raw.slice(2, 4), 16),
      blue: parseInt(raw.slice(4, 6), 16),
      alpha: parseInt(raw.slice(6, 8), 16)
    };
  }

  return undefined;
}

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(1, Math.max(0, value));
}

function toHexByte(value: number): string {
  return value.toString(16).padStart(2, "0");
}
