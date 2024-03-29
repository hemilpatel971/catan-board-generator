import { StrictUnion } from "./StrictUnion";
import { Range } from "./Range";

type ResourceProducingHexType =
  | "mountain"
  | "sheep"
  | "wood"
  | "hills"
  | "wheat"

type NonResourceProducingHexType =
  | "desert"
  | "sea"

type HexType = ResourceProducingHexType | NonResourceProducingHexType;

type NumberChitValue = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;

type Orientation = 0 | 60 | 120 | 180 | 240 | 300;

type PortType = "3:1" | "ore" | "wool" | "timber" | "brick" | "grain";
type PortOrientation = Orientation;
type Port = {
  type: PortType;
  /** Measured in degrees from west-facing */
  orientation: PortOrientation;
} & StrictUnion<
  | {
      fixed?: boolean;
    }
  | {
      moveable?: boolean;
    }
>;
type GroupNumber = Range<1, 20>;
type Hex<T extends Record<string, unknown> = never> = StrictUnion<
  | T
  | {
      type: ResourceProducingHexType;
      
      number?: NumberChitValue;
      
      numberGroup?: GroupNumber;
    }
  | {
      type: ResourceProducingHexType;
      
      number: NumberChitValue;
      secondNumber?: NumberChitValue;
      numberGroup?: GroupNumber;
    }
  | {
      type: "sea";
      
      port?: Port;
      
      portsAllowed?: true;
    }
  | {
      type: "sea";
      
      portsAllowed: false;
    }
  | {
      type: Exclude<NonResourceProducingHexType, "sea">;
    }
> & {
  fixed?: boolean;
  group?: GroupNumber;
  orientation?: Orientation;
};


type MaxPipsOnChit = 1 | 2 | 3 | 4 | 5;
type HexTemplate = StrictUnion<
  | Hex<{
      type: ResourceProducingHexType;
      number: NumberChitValue;
      /**
       * See {@link MaxPipsOnChit}
       */
      maxPipsOnChit: MaxPipsOnChit;
    }>
  | { type: "empty" }
>;

export type {
  ResourceProducingHexType,
  NonResourceProducingHexType,
  HexType,
  Hex,
  MaxPipsOnChit,
  NumberChitValue,
  PortType,
  PortOrientation,
  Port,
  HexTemplate,
};
