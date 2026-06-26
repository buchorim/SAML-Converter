"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // Source/Web/XmldomShim.ts
  var DOMParser = class extends globalThis.DOMParser {
    constructor(_options) {
      super();
    }
  };

  // Source/Web/PathShim.ts
  function basename(path, ext) {
    const name = path.split(/[/\\]/u).pop() || path;
    return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
  }
  function extname(path) {
    const dot = path.lastIndexOf(".");
    return dot > 0 ? path.slice(dot) : "";
  }

  // node_modules/svg-pathdata/dist/SVGPathDataEncoder.js
  var WSP = " ";
  function encodeSVGPath(commands) {
    let str = "";
    if (!Array.isArray(commands)) {
      commands = [commands];
    }
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.type === SVGPathData.CLOSE_PATH) {
        str += "z";
      } else if (command.type === SVGPathData.HORIZ_LINE_TO) {
        str += (command.relative ? "h" : "H") + command.x;
      } else if (command.type === SVGPathData.VERT_LINE_TO) {
        str += (command.relative ? "v" : "V") + command.y;
      } else if (command.type === SVGPathData.MOVE_TO) {
        str += (command.relative ? "m" : "M") + command.x + WSP + command.y;
      } else if (command.type === SVGPathData.LINE_TO) {
        str += (command.relative ? "l" : "L") + command.x + WSP + command.y;
      } else if (command.type === SVGPathData.CURVE_TO) {
        str += (command.relative ? "c" : "C") + command.x1 + WSP + command.y1 + WSP + command.x2 + WSP + command.y2 + WSP + command.x + WSP + command.y;
      } else if (command.type === SVGPathData.SMOOTH_CURVE_TO) {
        str += (command.relative ? "s" : "S") + command.x2 + WSP + command.y2 + WSP + command.x + WSP + command.y;
      } else if (command.type === SVGPathData.QUAD_TO) {
        str += (command.relative ? "q" : "Q") + command.x1 + WSP + command.y1 + WSP + command.x + WSP + command.y;
      } else if (command.type === SVGPathData.SMOOTH_QUAD_TO) {
        str += (command.relative ? "t" : "T") + command.x + WSP + command.y;
      } else if (command.type === SVGPathData.ARC) {
        str += (command.relative ? "a" : "A") + command.rX + WSP + command.rY + WSP + command.xRot + WSP + +command.lArcFlag + WSP + +command.sweepFlag + WSP + command.x + WSP + command.y;
      } else {
        throw new Error(`Unexpected command type "${command?.type}" at index ${i}.`);
      }
    }
    return str;
  }

  // node_modules/svg-pathdata/dist/mathUtils.js
  function rotate([x, y], rad) {
    return [
      x * Math.cos(rad) - y * Math.sin(rad),
      x * Math.sin(rad) + y * Math.cos(rad)
    ];
  }
  var DEBUG_CHECK_NUMBERS = true;
  function assertNumbers(...numbers) {
    if (DEBUG_CHECK_NUMBERS) {
      for (let i = 0; i < numbers.length; i++) {
        if ("number" !== typeof numbers[i]) {
          throw new Error(`assertNumbers arguments[${i}] is not a number. ${typeof numbers[i]} == typeof ${numbers[i]}`);
        }
      }
    }
    return true;
  }
  var PI = Math.PI;
  function annotateArcCommand(c, x1, y1) {
    c.lArcFlag = 0 === c.lArcFlag ? 0 : 1;
    c.sweepFlag = 0 === c.sweepFlag ? 0 : 1;
    let { rX, rY } = c;
    const { x, y } = c;
    if (Math.abs(rX) < 1e-10 || Math.abs(rY) < 1e-10) {
      c.rX = 0;
      c.rY = 0;
      c.cX = (x1 + x) / 2;
      c.cY = (y1 + y) / 2;
      c.phi1 = 0;
      c.phi2 = 0;
      return;
    }
    rX = Math.abs(c.rX);
    rY = Math.abs(c.rY);
    const xRotRad = c.xRot / 180 * PI;
    const [x1_, y1_] = rotate([(x1 - x) / 2, (y1 - y) / 2], -xRotRad);
    const testValue = Math.pow(x1_, 2) / Math.pow(rX, 2) + Math.pow(y1_, 2) / Math.pow(rY, 2);
    if (1 < testValue) {
      rX *= Math.sqrt(testValue);
      rY *= Math.sqrt(testValue);
    }
    c.rX = rX;
    c.rY = rY;
    const c_ScaleTemp = Math.pow(rX, 2) * Math.pow(y1_, 2) + Math.pow(rY, 2) * Math.pow(x1_, 2);
    const c_Scale = (c.lArcFlag !== c.sweepFlag ? 1 : -1) * Math.sqrt(Math.max(0, (Math.pow(rX, 2) * Math.pow(rY, 2) - c_ScaleTemp) / c_ScaleTemp));
    const cx_ = rX * y1_ / rY * c_Scale;
    const cy_ = -rY * x1_ / rX * c_Scale;
    const cRot = rotate([cx_, cy_], xRotRad);
    c.cX = cRot[0] + (x1 + x) / 2;
    c.cY = cRot[1] + (y1 + y) / 2;
    c.phi1 = Math.atan2((y1_ - cy_) / rY, (x1_ - cx_) / rX);
    c.phi2 = Math.atan2((-y1_ - cy_) / rY, (-x1_ - cx_) / rX);
    if (0 === c.sweepFlag && c.phi2 > c.phi1) {
      c.phi2 -= 2 * PI;
    }
    if (1 === c.sweepFlag && c.phi2 < c.phi1) {
      c.phi2 += 2 * PI;
    }
    c.phi1 *= 180 / PI;
    c.phi2 *= 180 / PI;
  }
  function intersectionUnitCircleLine(a, b, c) {
    assertNumbers(a, b, c);
    const termSqr = a * a + b * b - c * c;
    if (0 > termSqr) {
      return [];
    } else if (0 === termSqr) {
      return [[a * c / (a * a + b * b), b * c / (a * a + b * b)]];
    }
    const term = Math.sqrt(termSqr);
    return [
      [
        (a * c + b * term) / (a * a + b * b),
        (b * c - a * term) / (a * a + b * b)
      ],
      [
        (a * c - b * term) / (a * a + b * b),
        (b * c + a * term) / (a * a + b * b)
      ]
    ];
  }
  var DEG = Math.PI / 180;
  function lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }
  function arcAt(c, x1, x2, phiDeg) {
    return c + Math.cos(phiDeg / 180 * PI) * x1 + Math.sin(phiDeg / 180 * PI) * x2;
  }
  function bezierRoot(x0, x1, x2, x3) {
    const EPS = 1e-6;
    const x01 = x1 - x0;
    const x12 = x2 - x1;
    const x23 = x3 - x2;
    const a = 3 * x01 + 3 * x23 - 6 * x12;
    const b = (x12 - x01) * 6;
    const c = 3 * x01;
    if (Math.abs(a) < EPS) {
      return Math.abs(b) < EPS ? [] : [-c / b];
    }
    return pqFormula(b / a, c / a, EPS);
  }
  function bezierAt(x0, x1, x2, x3, t) {
    const s = 1 - t;
    const c0 = s * s * s;
    const c1 = 3 * s * s * t;
    const c2 = 3 * s * t * t;
    const c3 = t * t * t;
    return x0 * c0 + x1 * c1 + x2 * c2 + x3 * c3;
  }
  function pqFormula(p, q, PRECISION = 1e-6) {
    const discriminantX4 = p * p / 4 - q;
    if (discriminantX4 < -PRECISION) {
      return [];
    } else if (discriminantX4 <= PRECISION) {
      return [-p / 2];
    }
    const root = Math.sqrt(discriminantX4);
    return [-(p / 2) - root, -(p / 2) + root];
  }
  function a2c(arc, x0, y0) {
    if (!arc.cX) {
      annotateArcCommand(arc, x0, y0);
    }
    const xRotRad = arc.xRot / 180 * PI;
    if (Math.abs(arc.rX) < 1e-10 || Math.abs(arc.rY) < 1e-10) {
      return [
        {
          relative: arc.relative,
          type: SVGPathData.CURVE_TO,
          x1: x0 + (arc.x - x0) / 3,
          y1: y0 + (arc.y - y0) / 3,
          x2: x0 + 2 * (arc.x - x0) / 3,
          y2: y0 + 2 * (arc.y - y0) / 3,
          x: arc.x,
          y: arc.y
        }
      ];
    }
    const phiMin = Math.min(arc.phi1, arc.phi2), phiMax = Math.max(arc.phi1, arc.phi2), deltaPhi = phiMax - phiMin;
    const partCount = Math.ceil(deltaPhi / 90);
    const result = new Array(partCount);
    let prevX = x0;
    let prevY = y0;
    const transform = (x, y) => {
      const [xTemp, yTemp] = rotate([x * arc.rX, y * arc.rY], xRotRad);
      return [arc.cX + xTemp, arc.cY + yTemp];
    };
    for (let i = 0; i < partCount; i++) {
      const phiStart = lerp(arc.phi1, arc.phi2, i / partCount);
      const phiEnd = lerp(arc.phi1, arc.phi2, (i + 1) / partCount);
      const deltaPhi2 = phiEnd - phiStart;
      const f = 4 / 3 * Math.tan(deltaPhi2 * DEG / 4);
      const x1 = Math.cos(phiStart * DEG) - f * Math.sin(phiStart * DEG);
      const y1 = Math.sin(phiStart * DEG) + f * Math.cos(phiStart * DEG);
      const x = Math.cos(phiEnd * DEG);
      const y = Math.sin(phiEnd * DEG);
      const x2 = x + f * y;
      const y2 = y - f * x;
      const cp1 = transform(x1, y1);
      const cp2 = transform(x2, y2);
      const end = transform(x, y);
      const command = {
        relative: arc.relative,
        type: SVGPathData.CURVE_TO,
        x: end[0],
        y: end[1],
        x1: cp1[0],
        y1: cp1[1],
        x2: cp2[0],
        y2: cp2[1]
      };
      if (arc.relative) {
        command.x1 -= prevX;
        command.y1 -= prevY;
        command.x2 -= prevX;
        command.y2 -= prevY;
        command.x -= prevX;
        command.y -= prevY;
      }
      prevX = end[0];
      prevY = end[1];
      result[i] = command;
    }
    return result;
  }
  function arePointsCollinear(p1, p2, p3) {
    const v1x = p2[0] - p1[0];
    const v1y = p2[1] - p1[1];
    const v2x = p3[0] - p1[0];
    const v2y = p3[1] - p1[1];
    const cross = v1x * v2y - v1y * v2x;
    const isCollinear = Math.abs(cross) < 1e-10;
    if (!isCollinear)
      return false;
    const dot = v1x * v2x + v1y * v2y;
    const lenSqV1 = v1x * v1x + v1y * v1y;
    const lenSqV2 = v2x * v2x + v2y * v2y;
    return 0 <= dot && dot <= lenSqV2 && lenSqV1 <= lenSqV2;
  }

  // node_modules/svg-pathdata/dist/transformers/remove_collinear.js
  function REMOVE_COLLINEAR(commands) {
    if (commands.length <= 2)
      return commands;
    const results = [];
    const points = commands.map(SVGPathDataTransformer.INFO((cmd, pXAbs, pYAbs) => {
      const isRelatve = "relative" in cmd && cmd.relative;
      return [
        "x" in cmd ? cmd.x + (isRelatve ? pXAbs : 0) : pXAbs,
        "y" in cmd ? cmd.y + (isRelatve ? pYAbs : 0) : pYAbs
      ];
    }));
    let prevPoint = points[0];
    results.push(commands[0]);
    for (let i = 1; i < commands.length; i++) {
      const cmd = commands[i];
      const nextCmd = commands[i + 1];
      if (i < commands.length - 1 && nextCmd && cmd.type & SVGPathData.LINE_COMMANDS && nextCmd.type & SVGPathData.LINE_COMMANDS) {
        const nextPoint = points[i + 1];
        if (arePointsCollinear(prevPoint, points[i], nextPoint)) {
          if ("relative" in nextCmd && nextCmd.relative) {
            if ("x" in nextCmd)
              nextCmd.x = nextPoint[0] - prevPoint[0];
            if ("y" in nextCmd)
              nextCmd.y = nextPoint[1] - prevPoint[1];
          }
          continue;
        }
      }
      results.push(cmd);
      prevPoint = points[i];
    }
    return results;
  }

  // node_modules/svg-pathdata/dist/transformers/reverse_path.js
  function REVERSE_PATH(commands, preserveSubpathOrder = true) {
    if (commands.length < 2)
      return commands;
    const normalized = SVGPathDataTransformer.INFO((command, px, py) => ({
      ...command,
      x: command.x ?? px,
      y: command.y ?? py,
      relative: command.relative ?? false
    }));
    const result = [];
    let processing = [];
    for (const original of commands) {
      const cmd = normalized(original);
      if (cmd.type === SVGPathData.MOVE_TO && processing.length > 0) {
        if (preserveSubpathOrder) {
          result.push(...reverseSubpath(processing));
        } else {
          result.unshift(...reverseSubpath(processing));
        }
        processing = [];
      }
      processing.push(cmd);
    }
    if (processing.length > 0) {
      if (preserveSubpathOrder) {
        result.push(...reverseSubpath(processing));
      } else {
        result.unshift(...reverseSubpath(processing));
      }
    }
    return result;
  }
  function reverseSubpath(commands) {
    const isExplicitlyClosed = commands[commands.length - 1]?.type === SVGPathData.CLOSE_PATH;
    const startPointIndex = isExplicitlyClosed ? commands.length - 2 : commands.length - 1;
    const reversed = [
      {
        type: SVGPathData.MOVE_TO,
        relative: false,
        x: commands[startPointIndex].x,
        y: commands[startPointIndex].y
      }
    ];
    for (let i = startPointIndex; i > 0; i--) {
      const curCmd = commands[i];
      const prevPoint = commands[i - 1];
      if (curCmd.relative) {
        throw new Error("Relative command are not supported convert first with `toAbs()`");
      }
      switch (curCmd.type) {
        case SVGPathData.HORIZ_LINE_TO:
          reversed.push({
            type: SVGPathData.HORIZ_LINE_TO,
            relative: false,
            x: prevPoint.x
          });
          break;
        case SVGPathData.VERT_LINE_TO:
          reversed.push({
            type: SVGPathData.VERT_LINE_TO,
            relative: false,
            y: prevPoint.y
          });
          break;
        case SVGPathData.LINE_TO:
        case SVGPathData.MOVE_TO:
          reversed.push({
            type: SVGPathData.LINE_TO,
            relative: false,
            x: prevPoint.x,
            y: prevPoint.y
          });
          break;
        case SVGPathData.CURVE_TO:
          reversed.push({
            type: SVGPathData.CURVE_TO,
            relative: false,
            x: prevPoint.x,
            y: prevPoint.y,
            x1: curCmd.x2,
            y1: curCmd.y2,
            x2: curCmd.x1,
            y2: curCmd.y1
          });
          break;
        case SVGPathData.SMOOTH_CURVE_TO:
          throw new Error(`Unsupported command: S (smooth cubic bezier)`);
        case SVGPathData.SMOOTH_QUAD_TO:
          throw new Error(`Unsupported command: T (smooth quadratic bezier)`);
        case SVGPathData.ARC:
          throw new Error(`Unsupported command: A (arc)`);
        case SVGPathData.QUAD_TO:
          throw new Error(`Unsupported command: Q (quadratic bezier)`);
      }
    }
    if (isExplicitlyClosed) {
      reversed.push({ type: SVGPathData.CLOSE_PATH });
    }
    return reversed;
  }

  // node_modules/svg-pathdata/dist/SVGPathDataTransformer.js
  function ROUND(roundVal = 1e13) {
    assertNumbers(roundVal);
    function rf(val) {
      return Math.round(val * roundVal) / roundVal;
    }
    return function round(command) {
      if ("x1" in command && "undefined" !== typeof command.x1) {
        command.x1 = rf(command.x1);
      }
      if ("y1" in command && "undefined" !== typeof command.y1) {
        command.y1 = rf(command.y1);
      }
      if ("x2" in command && "undefined" !== typeof command.x2) {
        command.x2 = rf(command.x2);
      }
      if ("y2" in command && "undefined" !== typeof command.y2) {
        command.y2 = rf(command.y2);
      }
      if ("x" in command && "undefined" !== typeof command.x) {
        command.x = rf(command.x);
      }
      if ("y" in command && "undefined" !== typeof command.y) {
        command.y = rf(command.y);
      }
      if ("rX" in command && "undefined" !== typeof command.rX) {
        command.rX = rf(command.rX);
      }
      if ("rY" in command && "undefined" !== typeof command.rY) {
        command.rY = rf(command.rY);
      }
      return command;
    };
  }
  function TO_ABS() {
    return INFO((command, prevX, prevY) => {
      if (command.relative) {
        if ("undefined" !== typeof command.x1) {
          command.x1 += prevX;
        }
        if ("undefined" !== typeof command.y1) {
          command.y1 += prevY;
        }
        if ("undefined" !== typeof command.x2) {
          command.x2 += prevX;
        }
        if ("undefined" !== typeof command.y2) {
          command.y2 += prevY;
        }
        if ("undefined" !== typeof command.x) {
          command.x += prevX;
        }
        if ("undefined" !== typeof command.y) {
          command.y += prevY;
        }
        command.relative = false;
      }
      return command;
    });
  }
  function TO_REL() {
    return INFO((command, prevX, prevY) => {
      if (!command.relative) {
        if ("undefined" !== typeof command.x1) {
          command.x1 -= prevX;
        }
        if ("undefined" !== typeof command.y1) {
          command.y1 -= prevY;
        }
        if ("undefined" !== typeof command.x2) {
          command.x2 -= prevX;
        }
        if ("undefined" !== typeof command.y2) {
          command.y2 -= prevY;
        }
        if ("undefined" !== typeof command.x) {
          command.x -= prevX;
        }
        if ("undefined" !== typeof command.y) {
          command.y -= prevY;
        }
        command.relative = true;
      }
      return command;
    });
  }
  function NORMALIZE_HVZ(normalizeZ = true, normalizeH = true, normalizeV = true, normalizeC = true) {
    return INFO((command, prevX, prevY, pathStartX, pathStartY) => {
      if (isNaN(pathStartX) && !(command.type & SVGPathData.MOVE_TO)) {
        throw new Error("path must start with moveto");
      }
      if (normalizeH && command.type & SVGPathData.HORIZ_LINE_TO) {
        command.type = SVGPathData.LINE_TO;
        command.y = command.relative ? 0 : prevY;
      }
      if (normalizeV && command.type & SVGPathData.VERT_LINE_TO) {
        command.type = SVGPathData.LINE_TO;
        command.x = command.relative ? 0 : prevX;
      }
      if (normalizeZ && command.type & SVGPathData.CLOSE_PATH) {
        command.type = SVGPathData.LINE_TO;
        command.x = command.relative ? pathStartX - prevX : pathStartX;
        command.y = command.relative ? pathStartY - prevY : pathStartY;
      }
      if (command.type & SVGPathData.ARC && (0 === command.rX || 0 === command.rY)) {
        command.type = SVGPathData.LINE_TO;
        delete command.rX;
        delete command.rY;
        delete command.xRot;
        delete command.lArcFlag;
        delete command.sweepFlag;
      }
      if (normalizeC && command.type & SVGPathData.QUAD_TO) {
        const startPoint = [prevX, prevY];
        const controlPoint = command.relative ? [prevX + command.x1, prevY + command.y1] : [command.x1, command.y1];
        const endPoint = command.relative ? [prevX + command.x, prevY + command.y] : [command.x, command.y];
        if (arePointsCollinear(startPoint, controlPoint, endPoint)) {
          command.type = SVGPathData.LINE_TO;
          delete command.x1;
          delete command.y1;
        }
      }
      if (normalizeC && command.type & SVGPathData.CURVE_TO) {
        const startPoint = [prevX, prevY];
        const control1 = command.relative ? [prevX + command.x1, prevY + command.y1] : [command.x1, command.y1];
        const control2 = command.relative ? [prevX + command.x2, prevY + command.y2] : [command.x2, command.y2];
        const endPoint = command.relative ? [prevX + command.x, prevY + command.y] : [command.x, command.y];
        if (arePointsCollinear(startPoint, control1, endPoint) && arePointsCollinear(startPoint, control2, endPoint)) {
          command.type = SVGPathData.LINE_TO;
          delete command.x1;
          delete command.y1;
          delete command.x2;
          delete command.y2;
        }
      }
      return command;
    });
  }
  function NORMALIZE_ST() {
    let prevCurveC2X = NaN;
    let prevCurveC2Y = NaN;
    let prevQuadCX = NaN;
    let prevQuadCY = NaN;
    return INFO((command, prevX, prevY) => {
      if (command.type & SVGPathData.SMOOTH_CURVE_TO) {
        command.type = SVGPathData.CURVE_TO;
        prevCurveC2X = isNaN(prevCurveC2X) ? prevX : prevCurveC2X;
        prevCurveC2Y = isNaN(prevCurveC2Y) ? prevY : prevCurveC2Y;
        command.x1 = command.relative ? prevX - prevCurveC2X : 2 * prevX - prevCurveC2X;
        command.y1 = command.relative ? prevY - prevCurveC2Y : 2 * prevY - prevCurveC2Y;
      }
      if (command.type & SVGPathData.CURVE_TO) {
        prevCurveC2X = command.relative ? prevX + command.x2 : command.x2;
        prevCurveC2Y = command.relative ? prevY + command.y2 : command.y2;
      } else {
        prevCurveC2X = NaN;
        prevCurveC2Y = NaN;
      }
      if (command.type & SVGPathData.SMOOTH_QUAD_TO) {
        command.type = SVGPathData.QUAD_TO;
        prevQuadCX = isNaN(prevQuadCX) ? prevX : prevQuadCX;
        prevQuadCY = isNaN(prevQuadCY) ? prevY : prevQuadCY;
        command.x1 = command.relative ? prevX - prevQuadCX : 2 * prevX - prevQuadCX;
        command.y1 = command.relative ? prevY - prevQuadCY : 2 * prevY - prevQuadCY;
      }
      if (command.type & SVGPathData.QUAD_TO) {
        prevQuadCX = command.relative ? prevX + command.x1 : command.x1;
        prevQuadCY = command.relative ? prevY + command.y1 : command.y1;
      } else {
        prevQuadCX = NaN;
        prevQuadCY = NaN;
      }
      return command;
    });
  }
  function QT_TO_C() {
    let prevQuadX1 = NaN;
    let prevQuadY1 = NaN;
    return INFO((command, prevX, prevY) => {
      if (command.type & SVGPathData.SMOOTH_QUAD_TO) {
        command.type = SVGPathData.QUAD_TO;
        prevQuadX1 = isNaN(prevQuadX1) ? prevX : prevQuadX1;
        prevQuadY1 = isNaN(prevQuadY1) ? prevY : prevQuadY1;
        command.x1 = command.relative ? prevX - prevQuadX1 : 2 * prevX - prevQuadX1;
        command.y1 = command.relative ? prevY - prevQuadY1 : 2 * prevY - prevQuadY1;
      }
      if (command.type & SVGPathData.QUAD_TO) {
        prevQuadX1 = command.relative ? prevX + command.x1 : command.x1;
        prevQuadY1 = command.relative ? prevY + command.y1 : command.y1;
        const x1 = command.x1;
        const y1 = command.y1;
        command.type = SVGPathData.CURVE_TO;
        command.x1 = ((command.relative ? 0 : prevX) + x1 * 2) / 3;
        command.y1 = ((command.relative ? 0 : prevY) + y1 * 2) / 3;
        command.x2 = (command.x + x1 * 2) / 3;
        command.y2 = (command.y + y1 * 2) / 3;
      } else {
        prevQuadX1 = NaN;
        prevQuadY1 = NaN;
      }
      return command;
    });
  }
  function INFO(f) {
    let prevXAbs = 0;
    let prevYAbs = 0;
    let pathStartXAbs = NaN;
    let pathStartYAbs = NaN;
    return function transform(command) {
      if (isNaN(pathStartXAbs) && !(command.type & SVGPathData.MOVE_TO)) {
        throw new Error("path must start with moveto");
      }
      const result = f(command, prevXAbs, prevYAbs, pathStartXAbs, pathStartYAbs);
      if (command.type & SVGPathData.CLOSE_PATH) {
        prevXAbs = pathStartXAbs;
        prevYAbs = pathStartYAbs;
      }
      if ("x" in command && "undefined" !== typeof command.x) {
        prevXAbs = command.relative ? prevXAbs + command.x : command.x;
      }
      if ("y" in command && "undefined" !== typeof command.y) {
        prevYAbs = command.relative ? prevYAbs + command.y : command.y;
      }
      if (command.type & SVGPathData.MOVE_TO) {
        pathStartXAbs = prevXAbs;
        pathStartYAbs = prevYAbs;
      }
      return result;
    };
  }
  function SANITIZE(EPS = 0) {
    assertNumbers(EPS);
    let prevCurveC2X = NaN;
    let prevCurveC2Y = NaN;
    let prevQuadCX = NaN;
    let prevQuadCY = NaN;
    return INFO((command, prevX, prevY, pathStartX, pathStartY) => {
      const abs = Math.abs;
      let skip = false;
      let x1Rel = 0;
      let y1Rel = 0;
      if (command.type & SVGPathData.SMOOTH_CURVE_TO) {
        x1Rel = isNaN(prevCurveC2X) ? 0 : prevX - prevCurveC2X;
        y1Rel = isNaN(prevCurveC2Y) ? 0 : prevY - prevCurveC2Y;
      }
      if (command.type & (SVGPathData.CURVE_TO | SVGPathData.SMOOTH_CURVE_TO)) {
        prevCurveC2X = command.relative ? prevX + command.x2 : command.x2;
        prevCurveC2Y = command.relative ? prevY + command.y2 : command.y2;
      } else {
        prevCurveC2X = NaN;
        prevCurveC2Y = NaN;
      }
      if (command.type & SVGPathData.SMOOTH_QUAD_TO) {
        prevQuadCX = isNaN(prevQuadCX) ? prevX : 2 * prevX - prevQuadCX;
        prevQuadCY = isNaN(prevQuadCY) ? prevY : 2 * prevY - prevQuadCY;
      } else if (command.type & SVGPathData.QUAD_TO) {
        prevQuadCX = command.relative ? prevX + command.x1 : command.x1;
        prevQuadCY = command.relative ? prevY + command.y1 : command.y2;
      } else {
        prevQuadCX = NaN;
        prevQuadCY = NaN;
      }
      if (command.type & SVGPathData.LINE_COMMANDS || command.type & SVGPathData.ARC && (0 === command.rX || 0 === command.rY || !command.lArcFlag) || command.type & SVGPathData.CURVE_TO || command.type & SVGPathData.SMOOTH_CURVE_TO || command.type & SVGPathData.QUAD_TO || command.type & SVGPathData.SMOOTH_QUAD_TO) {
        const xRel = "undefined" === typeof command.x ? 0 : command.relative ? command.x : command.x - prevX;
        const yRel = "undefined" === typeof command.y ? 0 : command.relative ? command.y : command.y - prevY;
        x1Rel = !isNaN(prevQuadCX) ? prevQuadCX - prevX : "undefined" === typeof command.x1 ? x1Rel : command.relative ? command.x : command.x1 - prevX;
        y1Rel = !isNaN(prevQuadCY) ? prevQuadCY - prevY : "undefined" === typeof command.y1 ? y1Rel : command.relative ? command.y : command.y1 - prevY;
        const x2Rel = "undefined" === typeof command.x2 ? 0 : command.relative ? command.x : command.x2 - prevX;
        const y2Rel = "undefined" === typeof command.y2 ? 0 : command.relative ? command.y : command.y2 - prevY;
        if (abs(xRel) <= EPS && abs(yRel) <= EPS && abs(x1Rel) <= EPS && abs(y1Rel) <= EPS && abs(x2Rel) <= EPS && abs(y2Rel) <= EPS) {
          skip = true;
        }
      }
      if (command.type & SVGPathData.CLOSE_PATH) {
        if (abs(prevX - pathStartX) <= EPS && abs(prevY - pathStartY) <= EPS) {
          skip = true;
        }
      }
      return skip ? [] : command;
    });
  }
  function MATRIX(a, b, c, d, e, f) {
    assertNumbers(a, b, c, d, e, f);
    return INFO((command, prevX, prevY, pathStartX) => {
      const origX1 = command.x1;
      const origX2 = command.x2;
      const comRel = command.relative && !isNaN(pathStartX);
      const x = "undefined" !== typeof command.x ? command.x : comRel ? 0 : prevX;
      const y = "undefined" !== typeof command.y ? command.y : comRel ? 0 : prevY;
      if (command.type & SVGPathData.HORIZ_LINE_TO && 0 !== b) {
        command.type = SVGPathData.LINE_TO;
        command.y = command.relative ? 0 : prevY;
      }
      if (command.type & SVGPathData.VERT_LINE_TO && 0 !== c) {
        command.type = SVGPathData.LINE_TO;
        command.x = command.relative ? 0 : prevX;
      }
      if ("undefined" !== typeof command.x) {
        command.x = command.x * a + y * c + (comRel ? 0 : e);
      }
      if ("undefined" !== typeof command.y) {
        command.y = x * b + command.y * d + (comRel ? 0 : f);
      }
      if ("undefined" !== typeof command.x1) {
        command.x1 = command.x1 * a + command.y1 * c + (comRel ? 0 : e);
      }
      if ("undefined" !== typeof command.y1) {
        command.y1 = origX1 * b + command.y1 * d + (comRel ? 0 : f);
      }
      if ("undefined" !== typeof command.x2) {
        command.x2 = command.x2 * a + command.y2 * c + (comRel ? 0 : e);
      }
      if ("undefined" !== typeof command.y2) {
        command.y2 = origX2 * b + command.y2 * d + (comRel ? 0 : f);
      }
      function sqr(x2) {
        return x2 * x2;
      }
      const det = a * d - b * c;
      if ("undefined" !== typeof command.xRot) {
        if (1 !== a || 0 !== b || 0 !== c || 1 !== d) {
          if (0 === det) {
            delete command.rX;
            delete command.rY;
            delete command.xRot;
            delete command.lArcFlag;
            delete command.sweepFlag;
            command.type = SVGPathData.LINE_TO;
          } else {
            const xRot = command.xRot * Math.PI / 180;
            const sinRot = Math.sin(xRot);
            const cosRot = Math.cos(xRot);
            const xCurve = 1 / sqr(command.rX);
            const yCurve = 1 / sqr(command.rY);
            const A = sqr(cosRot) * xCurve + sqr(sinRot) * yCurve;
            const B = 2 * sinRot * cosRot * (xCurve - yCurve);
            const C = sqr(sinRot) * xCurve + sqr(cosRot) * yCurve;
            const A1 = A * d * d - B * b * d + C * b * b;
            const B1 = B * (a * d + b * c) - 2 * (A * c * d + C * a * b);
            const C1 = A * c * c - B * a * c + C * a * a;
            const newXRot = (Math.atan2(B1, A1 - C1) + Math.PI) % Math.PI / 2;
            const newSinRot = Math.sin(newXRot);
            const newCosRot = Math.cos(newXRot);
            command.rX = Math.abs(det) / Math.sqrt(A1 * sqr(newCosRot) + B1 * newSinRot * newCosRot + C1 * sqr(newSinRot));
            command.rY = Math.abs(det) / Math.sqrt(A1 * sqr(newSinRot) - B1 * newSinRot * newCosRot + C1 * sqr(newCosRot));
            command.xRot = newXRot * 180 / Math.PI;
          }
        }
      }
      if ("undefined" !== typeof command.sweepFlag && 0 > det) {
        command.sweepFlag = +!command.sweepFlag;
      }
      return command;
    });
  }
  function ROTATE(a, x = 0, y = 0) {
    assertNumbers(a, x, y);
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    return MATRIX(cos, sin, -sin, cos, x - x * cos + y * sin, y - x * sin - y * cos);
  }
  function TRANSLATE(dX, dY = 0) {
    assertNumbers(dX, dY);
    return MATRIX(1, 0, 0, 1, dX, dY);
  }
  function SCALE(dX, dY = dX) {
    assertNumbers(dX, dY);
    return MATRIX(dX, 0, 0, dY, 0, 0);
  }
  function SKEW_X(a) {
    assertNumbers(a);
    return MATRIX(1, 0, Math.tan(a), 1, 0, 0);
  }
  function SKEW_Y(a) {
    assertNumbers(a);
    return MATRIX(1, Math.tan(a), 0, 1, 0, 0);
  }
  function X_AXIS_SYMMETRY(xOffset = 0) {
    assertNumbers(xOffset);
    return MATRIX(-1, 0, 0, 1, xOffset, 0);
  }
  function Y_AXIS_SYMMETRY(yOffset = 0) {
    assertNumbers(yOffset);
    return MATRIX(1, 0, 0, -1, 0, yOffset);
  }
  function A_TO_C() {
    return INFO((command, prevX, prevY) => {
      if (SVGPathData.ARC === command.type) {
        return a2c(command, command.relative ? 0 : prevX, command.relative ? 0 : prevY);
      }
      return command;
    });
  }
  function ANNOTATE_ARCS() {
    return INFO((c, x1, y1) => {
      if (c.relative) {
        x1 = 0;
        y1 = 0;
      }
      if (SVGPathData.ARC === c.type) {
        annotateArcCommand(c, x1, y1);
      }
      return c;
    });
  }
  function CLONE() {
    return (c) => {
      return { ...c };
    };
  }
  function CALCULATE_BOUNDS() {
    const clone = CLONE();
    const toAbs = TO_ABS();
    const qtToC = QT_TO_C();
    const normST = NORMALIZE_ST();
    const f = INFO((command, prevXAbs, prevYAbs) => {
      const c = normST(qtToC(toAbs(clone(command))));
      function fixX(absX) {
        if (absX > f.maxX) {
          f.maxX = absX;
        }
        if (absX < f.minX) {
          f.minX = absX;
        }
      }
      function fixY(absY) {
        if (absY > f.maxY) {
          f.maxY = absY;
        }
        if (absY < f.minY) {
          f.minY = absY;
        }
      }
      if (c.type & SVGPathData.DRAWING_COMMANDS) {
        fixX(prevXAbs);
        fixY(prevYAbs);
      }
      if (c.type & SVGPathData.HORIZ_LINE_TO) {
        fixX(c.x);
      }
      if (c.type & SVGPathData.VERT_LINE_TO) {
        fixY(c.y);
      }
      if (c.type & SVGPathData.LINE_TO) {
        fixX(c.x);
        fixY(c.y);
      }
      if (c.type & SVGPathData.CURVE_TO) {
        fixX(c.x);
        fixY(c.y);
        const xDerivRoots = bezierRoot(prevXAbs, c.x1, c.x2, c.x);
        for (const derivRoot of xDerivRoots) {
          if (0 < derivRoot && 1 > derivRoot) {
            fixX(bezierAt(prevXAbs, c.x1, c.x2, c.x, derivRoot));
          }
        }
        const yDerivRoots = bezierRoot(prevYAbs, c.y1, c.y2, c.y);
        for (const derivRoot of yDerivRoots) {
          if (0 < derivRoot && 1 > derivRoot) {
            fixY(bezierAt(prevYAbs, c.y1, c.y2, c.y, derivRoot));
          }
        }
      }
      if (c.type & SVGPathData.ARC) {
        fixX(c.x);
        fixY(c.y);
        annotateArcCommand(c, prevXAbs, prevYAbs);
        const xRotRad = c.xRot / 180 * Math.PI;
        const x0 = Math.cos(xRotRad) * c.rX;
        const y0 = Math.sin(xRotRad) * c.rX;
        const x90 = -Math.sin(xRotRad) * c.rY;
        const y90 = Math.cos(xRotRad) * c.rY;
        const [phiMin, phiMax] = c.phi1 < c.phi2 ? [c.phi1, c.phi2] : -180 > c.phi2 ? [c.phi2 + 360, c.phi1 + 360] : [c.phi2, c.phi1];
        const normalizeXiEta = ([xi, eta]) => {
          const phiRad = Math.atan2(eta, xi);
          const phi = phiRad * 180 / Math.PI;
          return phi < phiMin ? phi + 360 : phi;
        };
        const xDerivRoots = intersectionUnitCircleLine(x90, -x0, 0).map(normalizeXiEta);
        for (const derivRoot of xDerivRoots) {
          if (derivRoot > phiMin && derivRoot < phiMax) {
            fixX(arcAt(c.cX, x0, x90, derivRoot));
          }
        }
        const yDerivRoots = intersectionUnitCircleLine(y90, -y0, 0).map(normalizeXiEta);
        for (const derivRoot of yDerivRoots) {
          if (derivRoot > phiMin && derivRoot < phiMax) {
            fixY(arcAt(c.cY, y0, y90, derivRoot));
          }
        }
      }
      return command;
    });
    f.minX = Infinity;
    f.maxX = -Infinity;
    f.minY = Infinity;
    f.maxY = -Infinity;
    return f;
  }
  var SVGPathDataTransformer = {
    ROUND,
    TO_ABS,
    TO_REL,
    NORMALIZE_HVZ,
    NORMALIZE_ST,
    QT_TO_C,
    INFO,
    SANITIZE,
    MATRIX,
    ROTATE,
    TRANSLATE,
    SCALE,
    SKEW_X,
    SKEW_Y,
    X_AXIS_SYMMETRY,
    Y_AXIS_SYMMETRY,
    A_TO_C,
    ANNOTATE_ARCS,
    CLONE,
    CALCULATE_BOUNDS,
    REVERSE_PATH,
    REMOVE_COLLINEAR
  };

  // node_modules/svg-pathdata/dist/TransformableSVG.js
  var TransformableSVG = class {
    round(x) {
      return this.transform(SVGPathDataTransformer.ROUND(x));
    }
    toAbs() {
      return this.transform(SVGPathDataTransformer.TO_ABS());
    }
    toRel() {
      return this.transform(SVGPathDataTransformer.TO_REL());
    }
    normalizeHVZ(a, b, c) {
      return this.transform(SVGPathDataTransformer.NORMALIZE_HVZ(a, b, c));
    }
    normalizeST() {
      return this.transform(SVGPathDataTransformer.NORMALIZE_ST());
    }
    qtToC() {
      return this.transform(SVGPathDataTransformer.QT_TO_C());
    }
    aToC() {
      return this.transform(SVGPathDataTransformer.A_TO_C());
    }
    sanitize(eps) {
      return this.transform(SVGPathDataTransformer.SANITIZE(eps));
    }
    translate(x, y) {
      return this.transform(SVGPathDataTransformer.TRANSLATE(x, y));
    }
    scale(x, y) {
      return this.transform(SVGPathDataTransformer.SCALE(x, y));
    }
    rotate(a, x, y) {
      return this.transform(SVGPathDataTransformer.ROTATE(a, x, y));
    }
    matrix(a, b, c, d, e, f) {
      return this.transform(SVGPathDataTransformer.MATRIX(a, b, c, d, e, f));
    }
    skewX(a) {
      return this.transform(SVGPathDataTransformer.SKEW_X(a));
    }
    skewY(a) {
      return this.transform(SVGPathDataTransformer.SKEW_Y(a));
    }
    xSymmetry(xOffset) {
      return this.transform(SVGPathDataTransformer.X_AXIS_SYMMETRY(xOffset));
    }
    ySymmetry(yOffset) {
      return this.transform(SVGPathDataTransformer.Y_AXIS_SYMMETRY(yOffset));
    }
    annotateArcs() {
      return this.transform(SVGPathDataTransformer.ANNOTATE_ARCS());
    }
  };

  // node_modules/svg-pathdata/dist/SVGPathDataParser.js
  var isWhiteSpace = (c) => " " === c || "	" === c || "\r" === c || "\n" === c;
  var isDigit = (c) => "0".charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= "9".charCodeAt(0);
  var SVGPathDataParser = class extends TransformableSVG {
    constructor() {
      super(...arguments);
      __publicField(this, "curNumber", "");
      __publicField(this, "curCommandType", -1);
      __publicField(this, "curCommandRelative", false);
      __publicField(this, "canParseCommandOrComma", true);
      __publicField(this, "curNumberHasExp", false);
      __publicField(this, "curNumberHasExpDigits", false);
      __publicField(this, "curNumberHasDecimal", false);
      __publicField(this, "curArgs", []);
    }
    finish(commands = []) {
      this.parse(" ", commands);
      if (0 !== this.curArgs.length || !this.canParseCommandOrComma) {
        throw new SyntaxError("Unterminated command at the path end.");
      }
      return commands;
    }
    parse(str, commands = []) {
      const finishCommand = (command) => {
        commands.push(command);
        this.curArgs.length = 0;
        this.canParseCommandOrComma = true;
      };
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        const isAArcFlag = this.curCommandType === SVGPathData.ARC && (this.curArgs.length === 3 || this.curArgs.length === 4) && this.curNumber.length === 1 && (this.curNumber === "0" || this.curNumber === "1");
        const isEndingDigit = isDigit(c) && (this.curNumber === "0" && c === "0" || isAArcFlag);
        if (isDigit(c) && !isEndingDigit) {
          this.curNumber += c;
          this.curNumberHasExpDigits = this.curNumberHasExp;
          continue;
        }
        if ("e" === c || "E" === c) {
          this.curNumber += c;
          this.curNumberHasExp = true;
          continue;
        }
        if (("-" === c || "+" === c) && this.curNumberHasExp && !this.curNumberHasExpDigits) {
          this.curNumber += c;
          continue;
        }
        if ("." === c && !this.curNumberHasExp && !this.curNumberHasDecimal && !isAArcFlag) {
          this.curNumber += c;
          this.curNumberHasDecimal = true;
          continue;
        }
        if (this.curNumber && -1 !== this.curCommandType) {
          const val = Number(this.curNumber);
          if (isNaN(val)) {
            throw new SyntaxError(`Invalid number ending at ${i}`);
          }
          if (this.curCommandType === SVGPathData.ARC) {
            if (0 === this.curArgs.length || 1 === this.curArgs.length) {
              if (0 > val) {
                throw new SyntaxError(`Expected positive number, got "${val}" at index "${i}"`);
              }
            } else if (3 === this.curArgs.length || 4 === this.curArgs.length) {
              if ("0" !== this.curNumber && "1" !== this.curNumber) {
                throw new SyntaxError(`Expected a flag, got "${this.curNumber}" at index "${i}"`);
              }
            }
          }
          this.curArgs.push(val);
          if (this.curArgs.length === COMMAND_ARG_COUNTS[this.curCommandType]) {
            if (SVGPathData.HORIZ_LINE_TO === this.curCommandType) {
              finishCommand({
                type: SVGPathData.HORIZ_LINE_TO,
                relative: this.curCommandRelative,
                x: val
              });
            } else if (SVGPathData.VERT_LINE_TO === this.curCommandType) {
              finishCommand({
                type: SVGPathData.VERT_LINE_TO,
                relative: this.curCommandRelative,
                y: val
              });
            } else if (this.curCommandType === SVGPathData.MOVE_TO || this.curCommandType === SVGPathData.LINE_TO || this.curCommandType === SVGPathData.SMOOTH_QUAD_TO) {
              finishCommand({
                type: this.curCommandType,
                relative: this.curCommandRelative,
                x: this.curArgs[0],
                y: this.curArgs[1]
              });
              if (SVGPathData.MOVE_TO === this.curCommandType) {
                this.curCommandType = SVGPathData.LINE_TO;
              }
            } else if (this.curCommandType === SVGPathData.CURVE_TO) {
              finishCommand({
                type: SVGPathData.CURVE_TO,
                relative: this.curCommandRelative,
                x1: this.curArgs[0],
                y1: this.curArgs[1],
                x2: this.curArgs[2],
                y2: this.curArgs[3],
                x: this.curArgs[4],
                y: this.curArgs[5]
              });
            } else if (this.curCommandType === SVGPathData.SMOOTH_CURVE_TO) {
              finishCommand({
                type: SVGPathData.SMOOTH_CURVE_TO,
                relative: this.curCommandRelative,
                x2: this.curArgs[0],
                y2: this.curArgs[1],
                x: this.curArgs[2],
                y: this.curArgs[3]
              });
            } else if (this.curCommandType === SVGPathData.QUAD_TO) {
              finishCommand({
                type: SVGPathData.QUAD_TO,
                relative: this.curCommandRelative,
                x1: this.curArgs[0],
                y1: this.curArgs[1],
                x: this.curArgs[2],
                y: this.curArgs[3]
              });
            } else if (this.curCommandType === SVGPathData.ARC) {
              finishCommand({
                type: SVGPathData.ARC,
                relative: this.curCommandRelative,
                rX: this.curArgs[0],
                rY: this.curArgs[1],
                xRot: this.curArgs[2],
                lArcFlag: this.curArgs[3],
                sweepFlag: this.curArgs[4],
                x: this.curArgs[5],
                y: this.curArgs[6]
              });
            }
          }
          this.curNumber = "";
          this.curNumberHasExpDigits = false;
          this.curNumberHasExp = false;
          this.curNumberHasDecimal = false;
          this.canParseCommandOrComma = true;
        }
        if (isWhiteSpace(c)) {
          continue;
        }
        if ("," === c && this.canParseCommandOrComma) {
          this.canParseCommandOrComma = false;
          continue;
        }
        if ("+" === c || "-" === c || "." === c) {
          this.curNumber = c;
          this.curNumberHasDecimal = "." === c;
          continue;
        }
        if (isEndingDigit) {
          this.curNumber = c;
          this.curNumberHasDecimal = false;
          continue;
        }
        if (0 !== this.curArgs.length) {
          throw new SyntaxError(`Unterminated command at index ${i}.`);
        }
        if (!this.canParseCommandOrComma) {
          throw new SyntaxError(`Unexpected character "${c}" at index ${i}. Command cannot follow comma`);
        }
        this.canParseCommandOrComma = false;
        if ("z" === c || "Z" === c) {
          commands.push({
            type: SVGPathData.CLOSE_PATH
          });
          this.canParseCommandOrComma = true;
          this.curCommandType = -1;
          continue;
        } else if ("h" === c || "H" === c) {
          this.curCommandType = SVGPathData.HORIZ_LINE_TO;
          this.curCommandRelative = "h" === c;
        } else if ("v" === c || "V" === c) {
          this.curCommandType = SVGPathData.VERT_LINE_TO;
          this.curCommandRelative = "v" === c;
        } else if ("m" === c || "M" === c) {
          this.curCommandType = SVGPathData.MOVE_TO;
          this.curCommandRelative = "m" === c;
        } else if ("l" === c || "L" === c) {
          this.curCommandType = SVGPathData.LINE_TO;
          this.curCommandRelative = "l" === c;
        } else if ("c" === c || "C" === c) {
          this.curCommandType = SVGPathData.CURVE_TO;
          this.curCommandRelative = "c" === c;
        } else if ("s" === c || "S" === c) {
          this.curCommandType = SVGPathData.SMOOTH_CURVE_TO;
          this.curCommandRelative = "s" === c;
        } else if ("q" === c || "Q" === c) {
          this.curCommandType = SVGPathData.QUAD_TO;
          this.curCommandRelative = "q" === c;
        } else if ("t" === c || "T" === c) {
          this.curCommandType = SVGPathData.SMOOTH_QUAD_TO;
          this.curCommandRelative = "t" === c;
        } else if ("a" === c || "A" === c) {
          this.curCommandType = SVGPathData.ARC;
          this.curCommandRelative = "a" === c;
        } else {
          throw new SyntaxError(`Unexpected character "${c}" at index ${i}.`);
        }
      }
      return commands;
    }
    /**
     * Return a wrapper around this parser which applies the transformation on parsed commands.
     */
    transform(transform) {
      const result = Object.create(this, {
        parse: {
          value(chunk, commands = []) {
            const parsedCommands = Object.getPrototypeOf(this).parse.call(this, chunk);
            for (const c of parsedCommands) {
              const cT = transform(c);
              if (Array.isArray(cT)) {
                commands.push(...cT);
              } else {
                commands.push(cT);
              }
            }
            return commands;
          }
        }
      });
      return result;
    }
  };

  // node_modules/svg-pathdata/dist/SVGPathData.js
  var _SVGPathData = class _SVGPathData extends TransformableSVG {
    constructor(content) {
      super();
      __publicField(this, "commands");
      if ("string" === typeof content) {
        this.commands = _SVGPathData.parse(content);
      } else {
        this.commands = content;
      }
    }
    encode() {
      return _SVGPathData.encode(this.commands);
    }
    getBounds() {
      const boundsTransform = SVGPathDataTransformer.CALCULATE_BOUNDS();
      this.transform(boundsTransform);
      return boundsTransform;
    }
    transform(transformFunction) {
      const newCommands = [];
      for (const command of this.commands) {
        const transformedCommand = transformFunction(command);
        if (Array.isArray(transformedCommand)) {
          newCommands.push(...transformedCommand);
        } else {
          newCommands.push(transformedCommand);
        }
      }
      this.commands = newCommands;
      return this;
    }
    /**
     * Reverses the order of path commands to go from end to start
     * IMPORTANT: This function expects absolute commands as input.
     * @param preserveSubpathOrder If true, keeps subpaths in their original order
     */
    reverse(preserveSubpathOrder = true) {
      this.commands = SVGPathDataTransformer.REVERSE_PATH(this.commands, preserveSubpathOrder);
      return this;
    }
    removeCollinear() {
      this.commands = SVGPathDataTransformer.REMOVE_COLLINEAR(this.commands);
      return this;
    }
    static encode(commands) {
      return encodeSVGPath(commands);
    }
    static parse(path) {
      const parser = new SVGPathDataParser();
      const commands = [];
      parser.parse(path, commands);
      parser.finish(commands);
      return commands;
    }
  };
  __publicField(_SVGPathData, "CLOSE_PATH", 1);
  __publicField(_SVGPathData, "MOVE_TO", 2);
  __publicField(_SVGPathData, "HORIZ_LINE_TO", 4);
  __publicField(_SVGPathData, "VERT_LINE_TO", 8);
  __publicField(_SVGPathData, "LINE_TO", 16);
  __publicField(_SVGPathData, "CURVE_TO", 32);
  __publicField(_SVGPathData, "SMOOTH_CURVE_TO", 64);
  __publicField(_SVGPathData, "QUAD_TO", 128);
  __publicField(_SVGPathData, "SMOOTH_QUAD_TO", 256);
  __publicField(_SVGPathData, "ARC", 512);
  __publicField(_SVGPathData, "LINE_COMMANDS", _SVGPathData.LINE_TO | _SVGPathData.HORIZ_LINE_TO | _SVGPathData.VERT_LINE_TO);
  __publicField(_SVGPathData, "DRAWING_COMMANDS", _SVGPathData.HORIZ_LINE_TO | _SVGPathData.VERT_LINE_TO | _SVGPathData.LINE_TO | _SVGPathData.CURVE_TO | _SVGPathData.SMOOTH_CURVE_TO | _SVGPathData.QUAD_TO | _SVGPathData.SMOOTH_QUAD_TO | _SVGPathData.ARC);
  var SVGPathData = _SVGPathData;
  var COMMAND_ARG_COUNTS = {
    [SVGPathData.MOVE_TO]: 2,
    [SVGPathData.LINE_TO]: 2,
    [SVGPathData.HORIZ_LINE_TO]: 1,
    [SVGPathData.VERT_LINE_TO]: 1,
    [SVGPathData.CLOSE_PATH]: 0,
    [SVGPathData.QUAD_TO]: 4,
    [SVGPathData.SMOOTH_QUAD_TO]: 2,
    [SVGPathData.CURVE_TO]: 6,
    [SVGPathData.SMOOTH_CURVE_TO]: 4,
    [SVGPathData.ARC]: 7
  };

  // Source/Color.ts
  var NamedColors = {
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
  function toAlightArgbColor(value, opacity = 1) {
    if (!value) {
      return void 0;
    }
    const cleanValue = value.trim().toLowerCase();
    if (cleanValue === "none" || cleanValue.startsWith("url(")) {
      return void 0;
    }
    const normalized = NamedColors[cleanValue] ?? cleanValue;
    const hex = parseHexColor(normalized) ?? parseRgbColor(normalized) ?? parseHslColor(normalized);
    if (!hex) {
      return void 0;
    }
    const alpha = Math.round(hex.alpha * clampOpacity(opacity));
    return `#${toHexByte(alpha)}${toHexByte(hex.red)}${toHexByte(hex.green)}${toHexByte(hex.blue)}`;
  }
  function parseRgbColor(value) {
    const match = value.match(/^rgba?\(([^)]+)\)$/u);
    if (!match) {
      return void 0;
    }
    const parts = match[1].split(",").map((part) => part.trim());
    if (parts.length < 3) {
      return void 0;
    }
    const red = parseColorComponent(parts[0]);
    const green = parseColorComponent(parts[1]);
    const blue = parseColorComponent(parts[2]);
    const alpha = parts[3] ? Math.round(clampOpacity(Number.parseFloat(parts[3])) * 255) : 255;
    if ([red, green, blue, alpha].some((part) => !Number.isFinite(part))) {
      return void 0;
    }
    return { red, green, blue, alpha };
  }
  function parseHslColor(value) {
    const match = value.match(/^hsla?\(([^)]+)\)$/u);
    if (!match) {
      return void 0;
    }
    const parts = match[1].split(",").map((part) => part.trim());
    if (parts.length < 3) {
      return void 0;
    }
    const hue = Number.parseFloat(parts[0]) % 360;
    const saturation = parsePercentage(parts[1]);
    const lightness = parsePercentage(parts[2]);
    const alpha = parts[3] ? Math.round(clampOpacity(Number.parseFloat(parts[3])) * 255) : 255;
    if ([hue, saturation, lightness, alpha].some((v) => !Number.isFinite(v))) {
      return void 0;
    }
    const { red, green, blue } = hslToRgb(hue < 0 ? hue + 360 : hue, saturation, lightness);
    return { red, green, blue, alpha };
  }
  function hslToRgb(hue, saturation, lightness) {
    const s = saturation / 100;
    const l = lightness / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(hue / 60 % 2 - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (hue < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (hue < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (hue < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (hue < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }
    return {
      red: Math.round((r + m) * 255),
      green: Math.round((g + m) * 255),
      blue: Math.round((b + m) * 255)
    };
  }
  function parsePercentage(value) {
    return Number.parseFloat(value.replace("%", ""));
  }
  function parseColorComponent(value) {
    if (value.endsWith("%")) {
      return Math.round(Number.parseFloat(value) / 100 * 255);
    }
    return Math.min(255, Math.max(0, Math.round(Number.parseFloat(value))));
  }
  function parseHexColor(value) {
    if (!value.startsWith("#")) {
      return void 0;
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
    return void 0;
  }
  function clampOpacity(value) {
    if (!Number.isFinite(value)) {
      return 1;
    }
    return Math.min(1, Math.max(0, value));
  }
  function toHexByte(value) {
    return value.toString(16).padStart(2, "0");
  }

  // Source/SvgParser.ts
  var DefaultSceneWidth = 1080;
  var DefaultSceneHeight = 1920;
  var DefaultDurationMs = 30040;
  var DefaultFps = 24;
  var IdentityMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  var SkipContainerTags = /* @__PURE__ */ new Set(["defs", "metadata", "script", "radialGradient", "mask", "clipPath", "pattern", "symbol", "title", "desc", "sodipodi:namedview"]);
  var UnsupportedDrawableTags = /* @__PURE__ */ new Set(["image"]);
  var SvgToAlightBlending = {
    multiply: "multiply",
    screen: "screen",
    overlay: "overlay",
    darken: "darken",
    lighten: "lighten",
    "color-dodge": "color-dodge",
    "color-burn": "color-burn",
    "hard-light": "hard-light",
    "soft-light": "soft-light",
    difference: "diff",
    exclusion: "exclusion",
    hue: "hue",
    saturation: "saturation",
    color: "color",
    luminosity: "luminance"
  };
  function parseSvgToVectorProject(svgText, inputPath, options = {}) {
    const warnings = [];
    const parser = new DOMParser({
      errorHandler: {
        warning: () => void 0,
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
    const layers = [];
    const skipped = { count: 0 };
    const initialStyle = readStyle(root, cssRules, {
      fill: "black",
      fillOpacity: 1,
      opacity: 1,
      stroke: void 0,
      strokeWidth: void 0,
      strokeOpacity: 1,
      strokeLinecap: void 0,
      strokeLinejoin: void 0,
      filter: void 0,
      display: void 0,
      visibility: void 0,
      mixBlendMode: void 0
    });
    visitChildren(root, initialStyle, IdentityMatrix, viewport, gradients, filters, cssRules, layers, warnings, skipped, options);
    const project = {
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
  function visitChildren(parent, style, parentMatrix, viewport, gradients, filters, cssRules, layers, warnings, skipped, options) {
    for (let index = 0; index < parent.childNodes.length; index += 1) {
      if (options.maxLayers && layers.length >= options.maxLayers) {
        return;
      }
      const child = parent.childNodes.item(index);
      if (child.nodeType !== child.ELEMENT_NODE) {
        continue;
      }
      const element = child;
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
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: readNumberAttribute(element, "x", 0),
          f: readNumberAttribute(element, "y", 0)
        });
        const rawPath2 = elementToPathData(resolved, warnings);
        if (!rawPath2) {
          skipped.count += 1;
          continue;
        }
        const pathData2 = convertPathData(rawPath2, viewport, useMatrix, warnings, readLabel(element, layers.length, options));
        if (!pathData2) {
          skipped.count += 1;
          continue;
        }
        const useStyle = readStyle(resolved, cssRules, nextStyle);
        layers.push(createLayer(resolved, useStyle, gradients, filters, pathData2, layers.length, options, viewport, warnings));
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
  function elementToPathData(element, warnings) {
    const tag = element.tagName.toLowerCase();
    if (tag === "path") {
      return element.getAttribute("d")?.trim() || void 0;
    }
    if (tag === "rect") {
      const width = readNumberAttribute(element, "width", 0);
      const height = readNumberAttribute(element, "height", 0);
      if (width <= 0 || height <= 0) {
        warnings.push({ code: "INVALID_RECT", message: "A <rect> element has non-positive width or height and was skipped." });
        return void 0;
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
      return radius > 0 ? ellipsePath(cx, cy, radius, radius) : void 0;
    }
    if (tag === "ellipse") {
      const cx = readNumberAttribute(element, "cx", 0);
      const cy = readNumberAttribute(element, "cy", 0);
      const rx = readNumberAttribute(element, "rx", 0);
      const ry = readNumberAttribute(element, "ry", 0);
      return rx > 0 && ry > 0 ? ellipsePath(cx, cy, rx, ry) : void 0;
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
        return void 0;
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
    return void 0;
  }
  function convertPathData(pathData, viewport, matrix, warnings, label) {
    try {
      const viewportMatrix = createViewportMatrix(viewport, matrix);
      return new SVGPathData(pathData).toAbs().normalizeHVZ(true, true, true).normalizeST().qtToC().aToC().matrix(viewportMatrix.a, viewportMatrix.b, viewportMatrix.c, viewportMatrix.d, viewportMatrix.e, viewportMatrix.f).round(1e3).sanitize(1e-5).encode();
    } catch (error) {
      warnings.push({
        code: "PATH_PARSE_FAILED",
        message: `Path "${label}" could not be converted: ${error instanceof Error ? error.message : String(error)}.`
      });
      return void 0;
    }
  }
  function createLayer(element, style, gradients, filters, pathData, layerIndex, options, viewport, warnings) {
    const opacity = style.opacity * style.fillOpacity;
    const gradient = resolveGradient(style.fill, gradients);
    const solidFill = toAlightArgbColor(style.fill, opacity);
    const strokeColor = toAlightArgbColor(style.stroke, style.opacity * style.strokeOpacity);
    const strokeWidth = style.strokeWidth && style.strokeWidth > 0 ? style.strokeWidth : void 0;
    const fillType = gradient ? "gradient" : solidFill ? "color" : "none";
    const fillColor = solidFill ?? gradient?.startColor ?? strokeColor ?? "#ff000000";
    const stroke = createStroke(style, strokeColor, strokeWidth);
    const effects = resolveFilterEffects(style.filter, filters);
    const blending = style.mixBlendMode ? SvgToAlightBlending[style.mixBlendMode] : void 0;
    if (style.fill?.trim().startsWith("url(") && !gradient) {
      warnings.push({
        code: "UNRESOLVED_GRADIENT",
        message: `Gradient fill on "${readLabel(element, layerIndex, options)}" could not be resolved; emitted Alight Motion gradient fallback.`
      });
    }
    const layerOpacity = style.opacity < 1 ? style.opacity.toFixed(6) : void 0;
    return {
      kind: "shape",
      id: (options.idBase ?? 1e8) + layerIndex,
      label: readLabel(element, layerIndex, options),
      pathData,
      fillType: gradient || style.fill?.trim().startsWith("url(") ? "gradient" : fillType,
      fillColor,
      gradient: gradient ?? (style.fill?.trim().startsWith("url(") ? createFallbackGradient(fillColor) : void 0),
      stroke,
      shadow: element.getAttribute("data-am-shadow") === "outside",
      blending,
      effects: effects.length > 0 ? effects : void 0,
      transform: {
        location: `${(viewport.width / 2).toFixed(6)},${(viewport.height / 2).toFixed(6)},0.000000`,
        opacity: layerOpacity
      }
    };
  }
  function createStroke(style, strokeColor, strokeWidth) {
    if (!style.stroke || style.stroke === "none" || !strokeWidth || !strokeColor) {
      return void 0;
    }
    return {
      color: strokeColor,
      width: strokeWidth,
      cap: style.strokeLinecap && style.strokeLinecap !== "butt" ? style.strokeLinecap : void 0,
      join: style.strokeLinejoin && style.strokeLinejoin !== "miter" ? style.strokeLinejoin : void 0
    };
  }
  function collectGradients(root) {
    const gradients = /* @__PURE__ */ new Map();
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
  function resolveGradient(fill, gradients) {
    if (!fill) {
      return void 0;
    }
    const match = fill.match(/^url\(#([^)]+)\)$/u);
    if (!match) {
      return void 0;
    }
    const gradient = gradients.get(match[1]);
    if (!gradient) {
      return void 0;
    }
    return {
      type: gradient.type,
      startColor: gradient.startColor,
      endColor: gradient.endColor,
      start: gradient.start,
      end: gradient.end
    };
  }
  function createFallbackGradient(color) {
    return {
      type: "linear",
      startColor: color,
      endColor: "#ffffffff",
      start: "0.000000,0.000000",
      end: "1.000000,1.000000"
    };
  }
  function readStopColor(stop) {
    if (!stop) {
      return void 0;
    }
    const inline = parseStyleAttribute(stop.getAttribute("style"));
    const color = stop.getAttribute("stop-color") ?? inline["stop-color"];
    const opacity = Number.parseFloat(stop.getAttribute("stop-opacity") ?? inline["stop-opacity"] ?? "1");
    return toAlightArgbColor(color, Number.isFinite(opacity) ? opacity : 1);
  }
  function readGradientPoint(gradient, xName, yName, fallback) {
    const x = parseGradientCoordinate(gradient.getAttribute(xName));
    const y = parseGradientCoordinate(gradient.getAttribute(yName));
    return x === void 0 || y === void 0 ? fallback : `${x.toFixed(6)},${y.toFixed(6)}`;
  }
  function parseGradientCoordinate(value) {
    if (!value) {
      return void 0;
    }
    if (value.endsWith("%")) {
      return Number.parseFloat(value) / 100;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : void 0;
  }
  var MinSceneSize = 1080;
  function readViewport(root, warnings, options) {
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
  function parseViewBox(value) {
    if (!value) {
      return void 0;
    }
    const parts = value.trim().split(/[\s,]+/u).map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part)) || parts[2] <= 0 || parts[3] <= 0) {
      return void 0;
    }
    return {
      minX: parts[0],
      minY: parts[1],
      width: parts[2],
      height: parts[3]
    };
  }
  function createViewportMatrix(viewport, matrix) {
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
  function readStyle(element, cssRules, inherited) {
    const inline = parseStyleAttribute(element.getAttribute("style"));
    const classNames = (element.getAttribute("class") || "").split(/\s+/u).filter(Boolean);
    const classStyles = {};
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
  function parseStyleAttribute(value) {
    if (!value) {
      return {};
    }
    return Object.fromEntries(
      value.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
        const separatorIndex = part.indexOf(":");
        if (separatorIndex === -1) {
          return [part, ""];
        }
        return [part.slice(0, separatorIndex).trim(), part.slice(separatorIndex + 1).trim()];
      })
    );
  }
  function readStringStyle(element, inline, name, fallback) {
    return element.getAttribute(name) || inline[name] || fallback;
  }
  function readNumberStyle(element, inline, name, fallback) {
    const raw = element.getAttribute(name) || inline[name];
    if (!raw) {
      return fallback ?? 1;
    }
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback ?? 1;
  }
  function readNumberAttribute(element, name, fallback) {
    const raw = element.getAttribute(name);
    if (!raw) {
      return fallback;
    }
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  var UnitConversion = {
    px: 1,
    "": 1,
    mm: 3.7795275591,
    cm: 37.795275591,
    in: 96,
    pt: 1.3333333333,
    pc: 16
  };
  function readDimension(value) {
    if (!value) {
      return void 0;
    }
    const match = value.trim().match(/^([\d.]+)\s*(mm|cm|in|pt|pc|px)?$/u);
    if (!match) {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
    }
    const num = Number.parseFloat(match[1]);
    const unit = match[2] ?? "";
    const multiplier = UnitConversion[unit] ?? 1;
    const result = num * multiplier;
    return Number.isFinite(result) && result > 0 ? result : void 0;
  }
  function readLabel(element, layerIndex, options) {
    const baseLabel = element.getAttribute("id") || element.getAttribute("aria-label") || `${element.tagName} ${layerIndex + 1}`;
    return options.labelPrefix ? `${options.labelPrefix} ${baseLabel}` : baseLabel;
  }
  function parsePoints(value) {
    if (!value) {
      return [];
    }
    const numbers = value.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/gu)?.map(Number) ?? [];
    const points = [];
    for (let index = 0; index + 1 < numbers.length; index += 2) {
      points.push([numbers[index], numbers[index + 1]]);
    }
    return points;
  }
  function rectPath(x, y, width, height, radiusX, radiusY) {
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
  function ellipsePath(cx, cy, rx, ry) {
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
  function parseTransform(value) {
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
  function transformToMatrix(name, numbers) {
    switch (name) {
      case "matrix":
        return numbers.length >= 6 ? { a: numbers[0], b: numbers[1], c: numbers[2], d: numbers[3], e: numbers[4], f: numbers[5] } : IdentityMatrix;
      case "translate":
        return { a: 1, b: 0, c: 0, d: 1, e: numbers[0] ?? 0, f: numbers[1] ?? 0 };
      case "scale":
        return { a: numbers[0] ?? 1, b: 0, c: 0, d: numbers[1] ?? numbers[0] ?? 1, e: 0, f: 0 };
      case "rotate": {
        const angle = (numbers[0] ?? 0) * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotation = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
        if (numbers.length >= 3) {
          return multiplyMatrices(multiplyMatrices({ a: 1, b: 0, c: 0, d: 1, e: numbers[1], f: numbers[2] }, rotation), { a: 1, b: 0, c: 0, d: 1, e: -numbers[1], f: -numbers[2] });
        }
        return rotation;
      }
      case "skewX": {
        const angle = (numbers[0] ?? 0) * Math.PI / 180;
        return { a: 1, b: 0, c: Math.tan(angle), d: 1, e: 0, f: 0 };
      }
      case "skewY": {
        const angle = (numbers[0] ?? 0) * Math.PI / 180;
        return { a: 1, b: Math.tan(angle), c: 0, d: 1, e: 0, f: 0 };
      }
      default:
        return IdentityMatrix;
    }
  }
  function multiplyMatrices(left, right) {
    return {
      a: left.a * right.a + left.c * right.b,
      b: left.b * right.a + left.d * right.b,
      c: left.a * right.c + left.c * right.d,
      d: left.b * right.c + left.d * right.d,
      e: left.a * right.e + left.c * right.f + left.e,
      f: left.b * right.e + left.d * right.f + left.f
    };
  }
  function collectCssRules(root) {
    const rules = /* @__PURE__ */ new Map();
    const styleElements = root.getElementsByTagName("style");
    for (let i = 0; i < styleElements.length; i += 1) {
      const text = styleElements[i]?.textContent ?? "";
      const rulePattern = /\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/gu;
      let match;
      while ((match = rulePattern.exec(text)) !== null) {
        rules.set(match[1], parseStyleAttribute(match[2]));
      }
    }
    return rules;
  }
  function collectFilters(root) {
    const filters = /* @__PURE__ */ new Map();
    const filterElements = root.getElementsByTagName("filter");
    for (let i = 0; i < filterElements.length; i += 1) {
      const filterEl = filterElements[i];
      if (!filterEl) {
        continue;
      }
      const id = filterEl.getAttribute("id");
      if (!id) {
        continue;
      }
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
  function resolveFilterEffects(filter, filters) {
    if (!filter) {
      return [];
    }
    const match = filter.match(/^url\(#([^)]+)\)$/u);
    if (!match) {
      return [];
    }
    const def = filters.get(match[1]);
    if (!def) {
      return [];
    }
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
  function resolveUseElement(useElement, parent) {
    const href = useElement.getAttribute("href") || useElement.getAttribute("xlink:href");
    if (!href || !href.startsWith("#")) {
      return void 0;
    }
    const targetId = href.slice(1);
    const root = useElement.ownerDocument?.documentElement;
    if (!root) {
      return void 0;
    }
    return findElementById(root, targetId);
  }
  function findElementById(parent, id) {
    if (parent.getAttribute("id") === id) {
      return parent;
    }
    for (let i = 0; i < parent.childNodes.length; i += 1) {
      const child = parent.childNodes.item(i);
      if (child.nodeType === child.ELEMENT_NODE) {
        const found = findElementById(child, id);
        if (found) {
          return found;
        }
      }
    }
    return void 0;
  }
  function createTextLayer(element, style, layerIndex, options, viewport) {
    const content = (element.textContent ?? "").trim();
    if (!content) {
      return void 0;
    }
    const inline = parseStyleAttribute(element.getAttribute("style"));
    const fontSizeRaw = element.getAttribute("font-size") || inline["font-size"] || "18";
    const fontSize = Number.parseFloat(fontSizeRaw);
    const anchor = element.getAttribute("text-anchor") || inline["text-anchor"] || "start";
    const align = anchor === "middle" ? "center" : anchor === "end" ? "right" : "left";
    const opacity = style.opacity * style.fillOpacity;
    const fillColor = toAlightArgbColor(style.fill, opacity) ?? "#ff000000";
    const blending = style.mixBlendMode ? SvgToAlightBlending[style.mixBlendMode] : void 0;
    return {
      kind: "text",
      id: (options.idBase ?? 1e8) + layerIndex,
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

  // Source/XmlUtilities.ts
  function escapeXmlAttribute(value) {
    return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot format non-finite number: ${value}`);
    }
    return value.toFixed(6);
  }

  // Source/AlightMotionExporter.ts
  var AlightMotionVersion = "com.alightcreative.motion/5.0.273.1028425";
  var AlightMotionVersionCode = "1028425";
  var FileFormatVersion = "106";
  function exportAlightMotionXml(project) {
    const scene = project.metadata;
    const lines = [
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
    return `${lines.join("\n")}
`;
  }
  function renderLayer(layer, centerX, centerY, totalTime, indentLevel) {
    if (layer.kind === "group") {
      return renderGroupLayer(layer, centerX, centerY, totalTime, indentLevel);
    }
    if (layer.kind === "text") {
      return renderTextLayer(layer, centerX, centerY, totalTime, indentLevel);
    }
    return renderShapeLayer(layer, centerX, centerY, totalTime, indentLevel);
  }
  function renderShapeLayer(layer, centerX, centerY, totalTime, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    const childIndent = "  ".repeat(indentLevel + 1);
    const attributes = [
      `id="${layer.id}"`,
      `label="${escapeXmlAttribute(layer.label)}"`,
      layer.hidden ? `hidden="true"` : void 0,
      `startTime="${formatWholeNumber(layer.startTime ?? 0)}"`,
      `endTime="${formatWholeNumber(layer.endTime ?? totalTime)}"`,
      layer.clippingMask ? `clippingMask="true"` : void 0,
      `fillType="${layer.fillType}"`,
      layer.blending && layer.blending !== "normal" ? `blending="${layer.blending}"` : void 0,
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
        layer.stroke.cap ? `cap="${layer.stroke.cap}"` : void 0,
        layer.stroke.join ? `join="${layer.stroke.join}"` : void 0,
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
  function splitSubpaths(pathData) {
    const subpaths = [];
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
  function computeSignedArea(d) {
    const coords = [];
    const re = /(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/gu;
    let match;
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
  function renderPathContours(pathData, indent) {
    const subpaths = splitSubpaths(pathData);
    if (subpaths.length <= 1) {
      return [`${indent}<path d="${escapeXmlAttribute(pathData)}" />`];
    }
    const lines = [];
    const mainArea = computeSignedArea(subpaths[0]);
    const mainSign = mainArea >= 0;
    lines.push(`${indent}<path>`);
    for (let i = 0; i < subpaths.length; i += 1) {
      const area = i === 0 ? mainArea : computeSignedArea(subpaths[i]);
      const sign = area >= 0;
      const isHole = i > 0 && sign !== mainSign;
      const attrs = isHole ? ` exclude="true" d="${escapeXmlAttribute(subpaths[i])}"` : ` d="${escapeXmlAttribute(subpaths[i])}"`;
      lines.push(`${indent}  <contour${attrs} />`);
    }
    lines.push(`${indent}</path>`);
    return lines;
  }
  function renderGroupLayer(layer, centerX, centerY, totalTime, indentLevel) {
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
      typeof layer.outTime === "number" ? `outTime="${formatWholeNumber(layer.outTime)}"` : void 0,
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
  function renderTransform(transform, centerX, centerY, indentLevel) {
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
  function renderSceneOpen(title, width, height, backgroundColor, totalTime, fps, retime) {
    return `<scene title="${title}" width="${formatWholeNumber(width)}" height="${formatWholeNumber(height)}" exportWidth="${formatWholeNumber(width)}" exportHeight="${formatWholeNumber(height)}" precompose="dynamicResolution" bgcolor="${backgroundColor}" totalTime="${formatWholeNumber(totalTime)}" fps="${formatWholeNumber(fps)}" modifiedTime="0" amver="${AlightMotionVersionCode}" ffver="${FileFormatVersion}" am="${AlightMotionVersion}" amplatform="android" retime="${retime}" retimeAdaptFPS="false">`;
  }
  function formatWholeNumber(value) {
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot format non-finite whole number: ${value}`);
    }
    return `${Math.round(value)}`;
  }
  function renderTextLayer(layer, centerX, centerY, totalTime, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    const childIndent = "  ".repeat(indentLevel + 1);
    const fontRef = `googlefonts?name=${escapeXmlAttribute(layer.fontFamily)}&amp;weight=${layer.fontWeight}`;
    const attributes = [
      `id="${layer.id}"`,
      layer.label ? `label="${escapeXmlAttribute(layer.label)}"` : void 0,
      layer.hidden ? `hidden="true"` : void 0,
      `startTime="${formatWholeNumber(layer.startTime ?? 0)}"`,
      `endTime="${formatWholeNumber(layer.endTime ?? totalTime)}"`,
      `fillType="${layer.fillType}"`,
      layer.blending && layer.blending !== "normal" ? `blending="${layer.blending}"` : void 0,
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
  function renderEffects(effects, indent) {
    if (!effects || effects.length === 0) {
      return [];
    }
    const lines = [];
    for (const effect of effects) {
      const attrs = [
        `id="${effect.id}"`,
        effect.hidden ? `hidden="true"` : void 0,
        effect.locallyApplied ? `locallyApplied="true"` : void 0
      ].filter(Boolean);
      lines.push(`${indent}<effect ${attrs.join(" ")}>`);
      for (const prop of effect.properties) {
        lines.push(`${indent}  <property name="${prop.name}" type="${prop.type}" value="${prop.value}" />`);
      }
      lines.push(`${indent}</effect>`);
    }
    return lines;
  }

  // Source/Web/Entry.ts
  function convertSvgToXml(svgText, filename) {
    const result = parseSvgToVectorProject(svgText, filename);
    const xml = exportAlightMotionXml(result.project);
    const baseName = filename.replace(/\.svg$/iu, "");
    return { filename: `${baseName}.xml`, xml };
  }
  window.SmlVerter = { convertSvgToXml };
})();
