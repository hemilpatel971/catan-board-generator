import {
  Hex,
  HexType,
  Port,
  PortOrientation,
} from "../types/hexes";
import { BinaryConstraints } from "../types/constraints";
import { CatanBoard, Neighbors } from "../types/boards";
import { HexGroups } from "./HexGroups";
import { hexToPipCount } from "../utils/catan";


if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

/**
 * An error to be thrown when board shuffling cannot be completed within
 * specified constraints after a set number of tries. Should include a message
 * indicating which stage of shuffling was unabled to be completed
 */
export class ShufflingError extends Error {}
export class TerrainShufflingError extends ShufflingError {}
export class NumberShufflingError extends ShufflingError {}
export class PortShufflingError extends ShufflingError {}
export class FishShufflingError extends ShufflingError {}
const MAX_RETRIES = 10000;


export function shuffle(
  board: CatanBoard,
  binaryConstraints: BinaryConstraints
): Hex[] {
  // shuffle terrain first
  let hexes = getShuffledTerrain(board);
  // and then numbers, which depends on terrain
  hexes = getShuffledNumbers(
    board,
    hexes,
    binaryConstraints
  );
  // and finally ports, which also depends on terrain
  hexes = getShuffledPorts(board, hexes);

  return hexes;
}

function getShuffledTerrain(
  board: CatanBoard,
): Hex[] {
  const hexes: Hex[] = structuredClone(board.recommendedLayout);
  const hexGroups = new HexGroups(hexes, "terrain");
  let randomIndex,
    retries = 0,
    encounteredIslandError = false,
    encounteredInlandError = false;
  const islandError =
    "Failed to find a board that falls within the specified constraints for" +
    " the minimum number of distinct islands. This board may be" +
    " over-constrained. Please lower the minimum acceptable" +
    " island count and try again.";
  const inlandError =
    "Failed to find a board that places all inland-only hexes, e.g. the lake," +
    " adjacent to non-sea hexes only. This board may not contain any valid inland" +
    " positions. If this scenario has variable islands, try lowering the minimum" +
    " island count in order to create larger landmasses. Otherwise, please consult" +
    " with the scenario creator, as it may be ill-specified.";

  topLoop: while (true) {
    hexGroups.reset();

    shuffleLoop: for (
      let currentIndex = hexes.length - 1;
      currentIndex >= 0;
      currentIndex--
    ) {
      // if this hex is fixed, skip it
      if (hexes[currentIndex].fixed) continue;
      for (let tries = 0; tries < 10; tries++) {
        // shuffle
        randomIndex = hexGroups.getRandomIndex();
        [hexes[currentIndex], hexes[randomIndex]] = [
          hexes[randomIndex],
          hexes[currentIndex],
        ];
        // no constraints were violated, so move to the next hex
        hexGroups.advanceCurrentIndex();
        continue shuffleLoop;
      }
      // we failed to find a valid board after exhausing all tries. start over
      if (retries++ > MAX_RETRIES)
        throw new TerrainShufflingError(
          encounteredInlandError
            ? inlandError
            : encounteredIslandError
            ? islandError
            : "Failed to find a board that falls within the specified constraints for" 
          
        );
      continue topLoop;
    }
    // we managed to create a valid board. time to move on!
    break;
  }

  return hexes;
}

function fisherYates(array: any[]) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

function getShuffledPorts(board: CatanBoard, hexes: Hex[]): Hex[] {
  for (let i = 0; i < board.recommendedLayout.length; i++) {
    if (board.recommendedLayout[i].port?.fixed) {
      hexes[i].port = board.recommendedLayout[i].port;
    }
  }

  // next, gather the remaining (non-fixed) ports
  const ports = board.recommendedLayout
    .filter(({ port }) => typeof port !== "undefined" && !port.fixed)
    .map(({ port }) => port as Port);
  // on some boards, all ports are fixed, so we can return now
  if (!ports.length) return hexes;
  // otherwise, shuffle what remains
  fisherYates(ports);
  for (const hex of hexes) {
    if (hex.port && !hex.port.fixed && !hex.port.moveable) {
      hex.port.type = ports.pop()!.type;
    }
  }
  
  if (!ports.length) return hexes;

  for (const hex of hexes) {
    if (hex.port?.moveable) delete hex.port;
  }
  const seaHexes = hexes
    .map((hex, i) => [hex, i] as [Hex, number])
    .filter(
      ([hex, _]) =>
        hex.type === "sea" && !hex.port && hex.portsAllowed !== false
    );
  
  fisherYates(seaHexes);
  
  for (const [seaHex, index] of seaHexes) {
    const validOrientations: PortOrientation[] = getValidPortOrientations(
      index,
      hexes,
      board
    );
    if (!validOrientations.length) continue;
   
    const orientation =
      validOrientations[Math.floor(Math.random() * validOrientations.length)];
  
    seaHex.port = { type: ports.pop()!.type, orientation };
    if (!ports.length) break;
  }
  if (ports.length)
    throw new PortShufflingError(
      "Unable to assign all ports to sea hexes. This might happen if your board" 
    );

  return hexes;
}


const directions: (keyof Neighbors)[] = ["w", "nw", "ne", "e", "se", "sw"];
const dirToOrientation: Record<keyof Neighbors, PortOrientation> = {
  w: 0,
  nw: 60,
  ne: 120,
  e: 180,
  se: 240,
  sw: 300,
};

export function getValidPortOrientations(
  index: number,
  shuffledHexes: Hex[],
  board: CatanBoard
): PortOrientation[] {
  if (shuffledHexes[index].type !== "sea" || shuffledHexes[index].port)
    return [];

  const validOrientations: PortOrientation[] = [];
  const neighbors = board.neighbors[index];
  for (let i = 0; i < directions.length; i++) {
    // establish the directions which will need various sorts of testing
    const heading = directions[i],
      counterClockwise =
        directions[(i + directions.length - 1) % directions.length],
      clockwise = directions[(i + 1) % directions.length];
    if (
      // hex in heading direction must exist and be land
      neighbors[heading] !== undefined &&
      !["sea", "fog", "lake"].includes(
        shuffledHexes[neighbors[heading]!].type
      ) &&
      // counterClockwise hex must either not exist or not have a clockwise port
      (neighbors[counterClockwise] === undefined ||
        shuffledHexes[neighbors[counterClockwise]!].port?.orientation !==
          dirToOrientation[clockwise]) &&
      // clockwise hex must either not exist or not have a counterClockwise port
      (neighbors[clockwise] === undefined ||
        shuffledHexes[neighbors[clockwise]!].port?.orientation !==
          dirToOrientation[counterClockwise])
    ) {
      validOrientations.push(dirToOrientation[heading]);
    }
  }

  return validOrientations;
}

function getShuffledNumbers(
  board: CatanBoard,
  hexes: Hex[],
  binaryConstraints: BinaryConstraints,
): Hex[] {
  const minPipsOnHexTypes: { [type in HexType]?: number } =
    board.minPipsOnHexTypes || {};
  const maxPipsOnHexTypes: { [type in HexType]?: number } =
    board.maxPipsOnHexTypes || {};
  if (hexes.some((h) => typeof h.numberGroup !== "undefined")) {
    for (const [i, h] of board.recommendedLayout.entries()) {
      hexes[i].number = h.number;
      hexes[i].secondNumber = h.secondNumber;
      hexes[i].numberGroup = h.numberGroup;
    }
  }
  const hexGroups = new HexGroups(hexes, "numbers", board.fixNumbersInGroups);
  let randomIndex,
    retries = 0;

  topLoop: while (true) {
    hexGroups.reset();

    shuffleLoop: for (
      let currentIndex = hexes.length - 1;
      currentIndex >= 0;
      currentIndex--
    ) {
      if (
        board.fixNumbersInGroups &&
        board.fixNumbersInGroups.includes(hexes[currentIndex].group)
      ) {
        hexes[currentIndex].number =
          board.recommendedLayout[currentIndex].number;
        continue;
      }
     
      if (hexes[currentIndex].number === undefined) continue;

      tryLoop: for (let tries = 0; tries < 10; tries++) {
        // shuffle
        randomIndex = hexGroups.getRandomIndex();
        [hexes[currentIndex].number, hexes[randomIndex].number] = [
          hexes[randomIndex].number,
          hexes[currentIndex].number,
        ];
        [hexes[currentIndex].secondNumber, hexes[randomIndex].secondNumber] = [
          hexes[randomIndex].secondNumber,
          hexes[currentIndex].secondNumber,
        ];
        const pipCount = hexToPipCount(hexes[currentIndex])!;
        if (
          pipCount < (minPipsOnHexTypes[hexes[currentIndex].type] || 1) ||
          pipCount > (maxPipsOnHexTypes[hexes[currentIndex].type] || 5) ||
          pipCount > board.maxPipsOnChits[currentIndex]
        ) {
          // eslint-disable-next-line no-extra-label
          continue tryLoop;
        }
        const neighborIndices = Object.values(
          board.neighbors[currentIndex]
        ).filter(
          (neighbor) =>
            neighbor > currentIndex ||
            (board.fixNumbersInGroups &&
              board.fixNumbersInGroups.includes(hexes[neighbor].group!))
        );

        // no 6/8 neighbors
        if (
          binaryConstraints.noAdjacentSixEight &&
          [6, 8].includes(hexes[currentIndex].number as number)
        ) {
          for (const neighbor of neighborIndices) {
            if ([6, 8].includes(hexes[neighbor].number as number)) {
              continue tryLoop;
            }
          }
        }

        // no 2/12 neighbors
        if (
          binaryConstraints.noAdjacentTwoTwelve &&
          [2, 12].includes(hexes[currentIndex].number as number)
        ) {
          for (const neighbor of neighborIndices) {
            if ([2, 12].includes(hexes[neighbor].number as number)) {
              continue tryLoop;
            }
          }
        }

        // no same number neighbors
        if (binaryConstraints.noAdjacentPairs) {
          for (const neighbor of neighborIndices) {
            if (hexes[currentIndex].number === hexes[neighbor].number) {
              continue tryLoop;
            }
          }
        }
        
        // no constraints were violated. continue shuffling
        hexGroups.advanceCurrentIndex();
        continue shuffleLoop;
      }

    
      if (retries++ > MAX_RETRIES)
        throw new NumberShufflingError(
          "Failed to find a board that falls within the specified constraints for"  
        );
      continue topLoop;
    }

    break;
  }

  return hexes;
}

interface GetIntersectionPipCountProps {
  board: CatanBoard;
  hexes: Hex[];
  atIndex: number;
  onlyHigher?: boolean;
}

export function getIntersectionPipCounts({
  board,
  hexes,
  atIndex,
  onlyHigher = true,
}: GetIntersectionPipCountProps): number[] {
  const neighbors = board.neighbors[atIndex],
    groups: (keyof Neighbors)[][] = [
      ["sw", "se"],
      ["se", "e"],
    ],
    intersections: number[][] = [];
  if (!onlyHigher) {
    groups.push(["e", "ne"], ["ne", "nw"], ["nw", "w"], ["w", "sw"]);
  } else if (board.fixNumbersInGroups) {
    const potentialGroups: (keyof Neighbors)[][][] = [
      [["ne"], ["e", "ne"]],
      [
        ["ne", "nw"],
        ["ne", "nw"],
      ],
      [
        ["nw", "w"],
        ["nw", "w"],
      ],
      [["w"], ["w", "sw"]],
    ];
    for (const [toCheck, toAdd] of potentialGroups) {
      if (
        toCheck.some((dir) => {
          return (
            board.recommendedLayout[neighbors[dir]!] &&
            board.fixNumbersInGroups!.includes(
              board.recommendedLayout[neighbors[dir]!]?.group
            )
          );
        })
      ) {
        groups.push(toAdd);
      }
    }
  }

  for (const group of groups) {
    const intersection: number[] = [atIndex];
    for (const dir of group) {
      if (dir in neighbors) intersection.push(neighbors[dir]!);
    }
    if (intersection.length > 1) intersections.push(intersection);
  }
  return intersections.map((intersection) =>
    intersection
      .map((i) => hexToPipCount(hexes[i]))
      .reduce((acc, n) => acc + n, 0 as number)
  );
}
