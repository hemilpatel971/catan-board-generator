import {
  HEX_WIDTH,
  SIDE_LENGTH,
  TRIANGLE_ALTITUDE,
  TRIANGLE_TO_SIDE_RATIO,
} from "../constants/imageProperties";
import {
  CatanBoard,
  CatanBoardTemplate,
  FixNumbersInGroupStrict,
  Neighbors,
} from "../types/boards";
import { Hex } from "../types/hexes";

export class BoardSpecError extends Error {}

export default function catanBoardFactory(
  template: CatanBoardTemplate
): CatanBoard {

  const flatNoEmpties = template.board
    .flat()
    .filter((ht) => ht.type !== "empty");
  flatNoEmpties.forEach((ht) => {
    if (!ht.fixed && ht.port?.fixed)
      throw new BoardSpecError(
        `Fixed ports can't appear on non-fixed hexes: ${ht}`
      );
    if (!ht.fixed && ht.port && !ht.port.moveable)
      throw new BoardSpecError(
        `Unmoveable ports can't appear on non-fixed hexes: ${ht}`
      );
  });
  if (template.fixNumbersInGroups) {
    const toCheck = template.fixNumbersInGroups.slice();
    if (toCheck.includes("all")) toCheck.splice(toCheck.indexOf("all"));
    for (const ht of flatNoEmpties) {
      if (!toCheck.length) break;
      if (toCheck.includes(ht.group)) toCheck.splice(toCheck.indexOf(ht.group));
    }
    if (toCheck.length) {
      throw new BoardSpecError(
        "The specified fixNumbersInGroups contains groups to which no hex" +
          ` belongs: ${toCheck}`
      );
    }
  }
  // numberGroup-related checks
  if (
    flatNoEmpties.some((h) => h.group !== undefined) &&
    flatNoEmpties.some((h) => h.numberGroup !== undefined)
  ) {
    throw new BoardSpecError(
      "Using group and numberGroup on the same board is not supported"
    );
  }
  if (
    flatNoEmpties.some((h) => h.numberGroup !== undefined) &&
    flatNoEmpties.some((h) => h.number === undefined && !h.fixed)
  ) {
    throw new BoardSpecError(
      "When using numberGroup, all hexes which don't include a number must be fixed"
    );
  }

  const maxPipsOnChits = flatNoEmpties.map((ht) =>
    ht.maxPipsOnChit === undefined ? 5 : ht.maxPipsOnChit
  );


  flatNoEmpties.forEach((ht) => delete ht.maxPipsOnChit);
  const recommendedLayout = flatNoEmpties as Hex[];

  const cssGridTemplateRows = `${TRIANGLE_TO_SIDE_RATIO}fr 1fr `
    .repeat(template.board.length)
    .concat(`${TRIANGLE_TO_SIDE_RATIO}fr`);

  const boardIndices: (number | undefined)[][] = [];
  const cssGridAreas: string[] = [];
  let maxColumn = 0,
    boardIndex = 0;
  for (let row = 0; row < template.board.length; row++) {
    boardIndices.push([]);
    const cssRow = 1 + row * 2;
    let cssCol = 1;
    for (let col = 0; col < template.board[row].length; col++) {
      if (template.board[row][col].type === "empty") {
        cssCol++;
        boardIndices[boardIndices.length - 1].push(undefined);
        continue;
      }
      cssGridAreas.push(
        `${cssRow} / ${cssCol} / ${cssRow + 3} / ${cssCol + 2}`
      );
      cssCol += 2;

      maxColumn = Math.max(maxColumn, cssCol - 1);
      boardIndices[boardIndices.length - 1].push(boardIndex);
      boardIndices[boardIndices.length - 1].push(boardIndex);
      boardIndex++;
    }
  }

  const cssGridTemplateColumns = `repeat(${maxColumn}, 1fr)`;

  
  const neighbors: Neighbors[] = [];
  for (let row = 0; row < boardIndices.length; row++) {
    for (let col = 0; col < boardIndices[row].length; col++) {
      if (boardIndices[row][col] === undefined) continue;

      const myNeighbors: Neighbors = {};
      neighbors.push(myNeighbors);
      for (const [dir, [nrow, ncol]] of Object.entries({
        nw: [row - 1, col - 1],
        ne: [row - 1, col + 1],
        e: [row, col + 2],
        se: [row + 1, col + 1],
        sw: [row + 1, col - 1],
        w: [row, col - 1],
      })) {
     
        if (nrow < 0 || nrow === boardIndices.length) continue;
        const neighbor = boardIndices[nrow][ncol];
        if (neighbor !== undefined)
          myNeighbors[dir as keyof Neighbors] = neighbor;
      }

      
      col++;
    }
  }

 
  let boardHeightPercentage, boardWidthPercentage;
  const width = (HEX_WIDTH * maxColumn) / 2;
  const height =
    TRIANGLE_ALTITUDE +
    (SIDE_LENGTH + TRIANGLE_ALTITUDE) * template.board.length;
  if (width > height) boardHeightPercentage = `${(height / width) * 100}%`;
  else if (height > width) boardWidthPercentage = `${(width / height) * 100}%`;


  let fixNumbersInGroups: FixNumbersInGroupStrict[];
  if (template.fixNumbersInGroups?.includes("all")) {
    fixNumbersInGroups = Array.from(
      new Set(flatNoEmpties.map((ht) => ht.group)).values()
    );
  } else {
    fixNumbersInGroups =
      template.fixNumbersInGroups as FixNumbersInGroupStrict[];
  }

  return {
    recommendedLayout,
    neighbors,
    cssGridTemplateColumns,
    cssGridTemplateRows,
    cssGridAreas,
    boardHeightPercentage,
    boardWidthPercentage,
    horizontal: template.horizontal,
    minPipsOnHexTypes: template.minPipsOnHexTypes,
    maxPipsOnHexTypes: template.maxPipsOnHexTypes,
    maxPipsOnChits,
    fixNumbersInGroups,
  };
}
