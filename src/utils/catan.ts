import { NumberChitValue, Hex } from "../types/hexes";

export function numberToPipCount(num: NumberChitValue): number {
  return 6 - Math.abs(7 - num);
}


export function hexToPipCount(hex: Hex): number {
  if (hex.number === undefined) return 0;
  let res = numberToPipCount(hex.number!);
  if (hex.secondNumber !== undefined)
    res += numberToPipCount(hex.secondNumber!);
  return res;
}
export function compareHexType(h1: Hex, h2: Hex): boolean {
  let [t1, t2] = [h1.type, h2.type];
  return t1 === t2;
}
