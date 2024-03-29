import {
  Hex,
  HexTemplate,
  MaxPipsOnChit,
  ResourceProducingHexType,
} from "./hexes";

export type CatanBoardTemplate = {
  /**
   * Board shape and initial layout. Each hex spans two CSS grid columns. A
   * special `HexTemplate` type `"empty"` is provided to specify *single* empty
   * columns. Thus, where `s` is sea and `t` is terrain, we can specify a board
   * that looks like this:
   *
   * ```
   *    s s s s
   *   s t t t s
   *  s t t t t s
   * s t t t t t s
   *  s t t t t s
   *   s t t t s
   *    s s s s
   * ```
   *
   * as follows, where `e` is `"empty"`:
   *
   * ```
   * e e e s s s s
   * e e s t t t s
   * e s t t t t s
   * s t t t t t s
   * e s t t t t s
   * e e s t t t s
   * e e e s s s s
   * ```
   */
  board: HexTemplate[][];
  /**
   * See {@link UseHorizonalLayout}
   */
  horizontal?: UseHorizonalLayout;
  /**
   * See {@link MinPipsOnHexTypes}
   */
  minPipsOnHexTypes?: MinPipsOnHexTypes;
  /**
   * See {@link MaxPipsOnHexTypes}
   */
  maxPipsOnHexTypes?: MaxPipsOnHexTypes;
  /**
   * See {@link FixNumbersInGroup}
   */
  fixNumbersInGroups?: FixNumbersInGroup[];
};

export type UseHorizonalLayout = boolean;

export type MinPipsOnHexTypes = {
  [type in ResourceProducingHexType]?: 2 | 3 | 4 | 5;
};

export type MaxPipsOnHexTypes = {
  [type in ResourceProducingHexType]?: 1 | 2 | 3 | 4;
};

export type FixNumbersInGroup = number | undefined | "all";

export type FixNumbersInGroupStrict = Exclude<FixNumbersInGroup, "all">;

export type Neighbors = Partial<
  Record<"nw" | "ne" | "e" | "se" | "sw" | "w", number>
>;
export interface CatanBoard {
  recommendedLayout: Hex[];
  neighbors: Neighbors[];
  cssGridTemplateColumns: string;
  cssGridTemplateRows: string;
  cssGridAreas: string[];
  boardWidthPercentage?: string;
  boardHeightPercentage?: string;
  horizontal?: UseHorizonalLayout;
  minPipsOnHexTypes?: MinPipsOnHexTypes;
  maxPipsOnHexTypes?: MaxPipsOnHexTypes;
  maxPipsOnChits: MaxPipsOnChit[];
  fixNumbersInGroups?: FixNumbersInGroupStrict[];
}

export type ExpansionName =
  | "Catan"
  | "Catan Extension 5-6 Player";

export type Expansions = Map<ExpansionName, CatanBoard>;
