import { FixNumbersInGroupStrict } from "../types/boards";
import { Hex } from "../types/hexes";

export type ShuffleType = "terrain" | "numbers";


class HexGroup {
  currentIndex: number;
  sourceIndices: number[];
  #internalIndex: number;

  constructor(hexes: Hex[], sourceIndices: number[], shuffleType: ShuffleType) {
    switch (shuffleType) {
      case "terrain":
        this.sourceIndices = sourceIndices.filter((_, i) => !hexes[i].fixed);
        break;
      case "numbers":
        this.sourceIndices = sourceIndices.filter(
          (_, i) => hexes[i].number !== undefined
        );
        break;
      default:
        ((_: never): never => {
          throw new Error("never");
        })(shuffleType);
    }

    this.#internalIndex = this.sourceIndices.length - 1;
    this.currentIndex = this.sourceIndices[this.#internalIndex];
  }


  getRandomIndex(): number {
    if (this.#internalIndex < 0)
      throw new Error("Tried to get random index from expended HexGroup");
    return this.sourceIndices[
      Math.floor(Math.random() * (this.#internalIndex + 1))
    ];
  }


  advanceCurrentIndex(): number | undefined {
    return (this.currentIndex = this.sourceIndices[--this.#internalIndex]);
  }


  reset(): number {
    return (this.currentIndex =
      this.sourceIndices[
        (this.#internalIndex = this.sourceIndices.length - 1)
      ]);
  }
}

export class HexGroups {
  #hexGroups: HexGroup[] = [];
  #currentHexGroup: number = 0;

  constructor(
    hexes: Hex[],
    shuffleType: ShuffleType,
    skipGroups?: FixNumbersInGroupStrict[]
  ) {
    const groupsAndIndices: [number | undefined, number][] = hexes.map(
      (h, i) => [
        h.group || (shuffleType === "numbers" && h.numberGroup) || undefined,
        i,
      ]
    );
    const uniqueGroups = Array.from(
      new Set(groupsAndIndices.map(([g, _]) => g)).values()
    );
    this.#hexGroups = uniqueGroups
      .filter((groupId) => !(skipGroups && skipGroups.includes(groupId)))
      .map((groupId) => {
        const indices = groupsAndIndices
          .filter(([g]) => g === groupId)
          .map(([, i]) => i);
        return new HexGroup(
          indices.map((i) => hexes[i]),
          indices,
          shuffleType
        );
      });
    this.#setCurrentHexGroup();
  }

  getRandomIndex(): number {
    return this.#hexGroups[this.#currentHexGroup].getRandomIndex();
  }

  advanceCurrentIndex(): void {
    this.#hexGroups[this.#currentHexGroup].advanceCurrentIndex();
    this.#setCurrentHexGroup();
  }

  reset(): void {
    this.#hexGroups.forEach((hg) => hg.reset());
    this.#setCurrentHexGroup();
  }


  #setCurrentHexGroup(): void {
    let largest = -1;
    for (const [i, group] of this.#hexGroups.entries()) {
      if (group.currentIndex > largest) {
        largest = group.currentIndex;
        this.#currentHexGroup = i;
      }
    }
  }
}
