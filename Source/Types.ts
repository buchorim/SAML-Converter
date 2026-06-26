// / - Arinara Network © 2026 - /
// This source code is the exclusive property of Arinara Network.
// Unauthorized use, reproduction, distribution, or modification of this
// code — in whole or in part — for any purpose whatsoever is strictly
// prohibited without prior written consent from Arinara Network as the
// sole legal owner of this codebase.

export type FillType = "color" | "gradient" | "none" | "intrinsic";

export type BlendingMode =
  | "normal"
  | "multiply" | "screen" | "overlay"
  | "darken" | "lighten"
  | "color-dodge" | "color-burn"
  | "hard-light" | "soft-light"
  | "diff" | "exclusion"
  | "hue" | "saturation" | "color" | "luminance"
  | "linear-burn" | "linear-dodge" | "linear-light"
  | "vivid-light" | "pin-light"
  | "darker-color" | "lighter-color"
  | "soft-overlay" | "divide" | "subtract"
  | "mask" | "exclude";

export interface ConversionWarning {
  code: string;
  message: string;
}

export interface ConversionReport {
  inputPath: string;
  outputPath?: string;
  exportedLayers: number;
  skippedElements: number;
  warnings: ConversionWarning[];
}

export interface SceneMetadata {
  title: string;
  width: number;
  height: number;
  fps: number;
  totalTime: number;
  backgroundColor: string;
}

export interface LayerTransform {
  location?: string;
  scale?: string;
  rotation?: string;
  opacity?: string;
  pivot?: string;
}

export interface GradientStyle {
  type: "linear" | "radial" | "sweep";
  startColor: string;
  endColor: string;
  start: string;
  end: string;
}

export interface StrokeStyle {
  color: string;
  width: number;
  cap?: string;
  join?: string;
}

export interface EffectProperty {
  name: string;
  type: "float" | "vec2" | "bool" | "color" | "int";
  value: string;
}

export interface EffectDefinition {
  id: string;
  hidden?: boolean;
  locallyApplied?: boolean;
  properties: EffectProperty[];
}

export interface VectorLayer {
  kind: "shape";
  id: number;
  label: string;
  pathData: string;
  fillType: FillType;
  fillColor: string;
  gradient?: GradientStyle;
  stroke?: StrokeStyle;
  shadow?: boolean;
  borderDirection?: "inside" | "centered" | "outside";
  hidden?: boolean;
  clippingMask?: boolean;
  blending?: BlendingMode;
  effects?: EffectDefinition[];
  transform?: LayerTransform;
  startTime?: number;
  endTime?: number;
}

export interface TextLayer {
  kind: "text";
  id: number;
  label?: string;
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  align: "left" | "center" | "right";
  wrapWidth: number;
  fillType: FillType;
  fillColor: string;
  hidden?: boolean;
  blending?: BlendingMode;
  effects?: EffectDefinition[];
  transform?: LayerTransform;
  startTime?: number;
  endTime?: number;
}

export interface GroupLayer {
  kind: "group";
  id: number;
  label: string;
  layers: ProjectLayer[];
  transform?: LayerTransform;
  startTime?: number;
  endTime?: number;
  outTime?: number;
  width?: number;
  height?: number;
  totalTime?: number;
}

export type ProjectLayer = VectorLayer | TextLayer | GroupLayer;

export interface VectorProject {
  metadata: SceneMetadata;
  layers: ProjectLayer[];
  warnings: ConversionWarning[];
  skippedElements: number;
}

export interface SvgParseResult {
  project: VectorProject;
}

export interface SvgViewport {
  width: number;
  height: number;
  viewBoxMinX: number;
  viewBoxMinY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
}
