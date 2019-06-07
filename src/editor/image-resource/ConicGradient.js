import { Gradient } from "./Gradient";
import { EMPTY_STRING, WHITE_STRING } from "../../util/css/types";
import {
  isNotUndefined,
  isString,
  isUndefined
} from "../../util/functions/func";
import { ColorStep } from "./ColorStep";
import { Length, Position } from "../unit/Length";
import { convertMatches, reverseMatches } from "../../util/functions/parser";

const DEFINED_POSITIONS = {
  ["center"]: true,
  ["top"]: true,
  ["left"]: true,
  ["right"]: true,
  ["bottom"]: true
};

const DEFINED_ANGLES = {
  "to top": 0,
  "to top right": 45,
  "to right": 90,
  "to bottom right": 135,
  "to bottom": 180,
  "to bottom left": 225,
  "to left": 270,
  "to top left": 315
};

export class ConicGradient extends Gradient {
  getDefaultObject(obj = {}) {
    return super.getDefaultObject({
      type: "conic-gradient",
      angle: 0,
      radialPosition: [Position.CENTER, Position.CENTER],
      ...obj
    });
  }

  isConic() {
    return true;
  }
  hasAngle() {
    return true;
  }

  getColorString() {
    var colorsteps = this.colorsteps;
    if (!colorsteps) return EMPTY_STRING;

    colorsteps.sort((a, b) => {
      if (a.percent == b.percent) {
        if (a.index > b.index) return 1;
        if (a.index < b.index) return 0;
        return 0;
      }
      return a.percent > b.percent ? 1 : -1;
    });

    var newColors = colorsteps.map((c, index) => {
      c.prevColorStep = c.cut && index > 0 ? colorsteps[index - 1] : null;
      return c;
    });

    return newColors
      .map(f => {
        var deg = Math.floor(f.percent * 3.6);
        var prev = EMPTY_STRING;

        if (f.cut && f.prevColorStep) {
          var prevDeg = Math.floor(f.prevColorStep.percent * 3.6);
          prev = `${prevDeg}deg`;
        }
        return `${f.color} ${prev} ${deg}deg`;
      })
      .join(",");
  }

  toString() {
    var colorString = this.getColorString();

    var opt = [];
    var json = this.json;

    var conicAngle = json.angle;
    var conicPosition = json.radialPosition || Position.CENTER;

    conicPosition = DEFINED_POSITIONS[conicPosition]
      ? conicPosition
      : conicPosition.join(WHITE_STRING);

    if (isNotUndefined(conicAngle)) {
      conicAngle = +(DEFINED_ANGLES[conicAngle] || conicAngle);
      opt.push(`from ${conicAngle}deg`);
    }

    if (conicPosition) {
      opt.push(`at ${conicPosition}`);
    }

    var optString = opt.length ? opt.join(WHITE_STRING) + "," : EMPTY_STRING;

    return `${json.type}(${optString} ${colorString})`;
  }

  static parse(str) {
    var results = convertMatches(str);
    var angle = "0deg"; //
    var radialPosition = [Position.CENTER, Position.CENTER];
    var colorsteps = [];
    results.str
      .split("(")[1]
      .split(")")[0]
      .split(",")
      .map(it => it.trim())
      .forEach((newValue, index) => {
        if (newValue.includes("@")) {
          // conic 은 최종 값이 deg 라  gradient 의 공통 영역을 위해서
          // deg 르 % 로 미리 바꾸는 작업이 필요하다.
          newValue = newValue
            .split(WHITE_STRING)
            .map(it => it.trim())
            .map(it => {
              if (it.includes("deg")) {
                return Length.parse(it).toPercent();
              } else {
                return it;
              }
            })
            .join(WHITE_STRING);

          // color 복원
          newValue = reverseMatches(newValue, results.matches);

          // 나머지는 ColorStep 이 파싱하는걸로
          // ColorStep 은 파싱이후 colorsteps 를 리턴해줌... 배열임, 명심 명심
          colorsteps.push(...ColorStep.parse(newValue));
        } else {
          // direction
          if (newValue.includes("at")) {
            // at 이 있으면 radialPosition 이 있는 것임
            [angle, radialPosition] = newValue.split("at").map(it => it.trim());
          } else {
            // at 이 없으면 radialPosition 이 center, center 로 있음
            angle = newValue;
          }

          if (isString(radialPosition)) {
            var arr = radialPosition.split(WHITE_STRING);
            if (arr.length === 1) {
              var len = Length.parse(arr[0]);

              if (len.isString()) {
                radialPosition = [len.value, len.value];
              } else {
                radialPosition = [len.clone(), len.clone()];
              }
            } else if (arr.length === 2) {
              radialPosition = arr.map(it => {
                var len = Length.parse(it);
                return len.isString() ? len.value : len;
              });
            }
          }

          if (isString(angle)) {
            if (angle.includes("from")) {
              angle = angle.split("from")[1];

              angle = isUndefined(DEFINED_ANGLES[angle])
                ? Length.parse(angle)
                : Length.deg(+DEFINED_ANGLES[angle]);
            }
          }
        }
      });

    return new ConicGradient({ angle, radialPosition, colorsteps });
  }
}