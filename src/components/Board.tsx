import "../css/board.css";
import {
  pastureVertical,
  forestVertical,
  hillsVertical,
  mountainsVertical,
  fieldsVertical,
  desertVertical,
  seaVertical,
  two,
  three,
  four,
  five,
  six,
  eight,
  nine,
  ten,
  eleven,
  twelve,
  port3to1WithDocks,
  portBrickWithDocks,
  portGrainWithDocks,
  portOreWithDocks,
  portTimberWithDocks,
  portWoolWithDocks,
} from "../images/index";
import { Hex, HexType, PortType } from "../types/hexes";
import { CatanBoard } from "../types/boards";
import { Paper } from "@mui/material";
import { HEX_HEIGHT, HEX_WIDTH } from "../constants/imageProperties";


const hexTypeToImg: { [type in HexType]: [string, string | "auto"] } = {
  sheep: [pastureVertical, "auto"],
  wood: [forestVertical, "auto"],
  hills: [hillsVertical, "auto"],
  mountain: [mountainsVertical, "auto"],
  wheat: [fieldsVertical, "auto"],
  desert: [desertVertical, "auto"],
  sea: [seaVertical, "auto"],
};

const numberValToImg = [
  null,
  null,
  two,
  three,
  four,
  five,
  six,
  null,
  eight,
  nine,
  ten,
  eleven,
  twelve,
];

const portTypeToImage: { [type in PortType]: string } = {
  "3:1": port3to1WithDocks,
  brick: portBrickWithDocks,
  grain: portGrainWithDocks,
  ore: portOreWithDocks,
  timber: portTimberWithDocks,
  wool: portWoolWithDocks,
};

interface Props {
  hexes: Hex[];
  board: CatanBoard;
}

const HEX_SIZE = "90%";


export default function Board({ hexes, board }: Props) {
  const horizontal =
    typeof board.horizontal !== "undefined" && board.horizontal;

  return (
    <>
      <Paper style={{ textAlign: "center", fontSize: "1.2rem", marginBottom: "1px" ,  }}>
        <div style={{ margin: "2px" }}>Catan Board Generator</div>
      </Paper>
      <Paper 
        id="board-container"
        elevation={20}
        style={{
          margin: 10,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#12518c",
        }}
      > 
        
        <div
          style={{
            width:
              typeof board.boardWidthPercentage !== "undefined"
                ? board.boardWidthPercentage
                : "100%",
            height:
              typeof board.boardHeightPercentage !== "undefined"
                ? board.boardHeightPercentage
                : "100%",
            display: "grid",
            gridTemplateColumns: board.cssGridTemplateColumns,
            gridTemplateRows: board.cssGridTemplateRows,
            transform: horizontal ? "rotate(90deg)" : "",
          }}
        >
          {hexes.map(
            (
              { type, number, secondNumber, orientation, port },
              i
            ) => (
              
              // https://stackoverflow.com/a/67527395/12162258
              <div
                key={i}
                style={{
                  height: "100%",
                  width: "100%",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gridArea: board.cssGridAreas[i],
                }}
              >
                <img
                  src={
                    hexTypeToImg[type][Number(horizontal)]
                  }
                  alt={`${type} hex at position ${i}. Positions indices run left to
              right, top to bottom`}
                  style={{
                    width: HEX_SIZE,
                    height: HEX_SIZE,
                    position: "absolute",
                    zIndex: 1,
                    transform: `rotate(${
                      (orientation || 0) +
                      Number(
                        hexTypeToImg[type][Number(horizontal)] === "auto" &&
                          -120
                      )
                    }deg)`,
                  }}
                />
                {number && secondNumber === undefined && (
                  <img
                    src={numberValToImg[number]!}
                    alt={`${number} chit at position ${i}`}
                    style={{
                      width: "35%",
                      height: `${(35 * HEX_WIDTH) / HEX_HEIGHT}%`,
                      position: "absolute",
                      zIndex: 2,
                      transform: horizontal ? "rotate(-90deg)" : "",
                    }}
                  />
                )}
                {number && secondNumber && (
                  <div
                    style={{
                      height: "100%",
                      width: "100%",
                      position: "relative",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gridArea: board.cssGridAreas[i],
                    }}
                  >
                    <img
                      src={numberValToImg[number]!}
                      alt={`${number} chit at position ${i}`}
                      style={{
                        width: "30%",
                        height: `${(30 * HEX_WIDTH) / HEX_HEIGHT}%`,
                        zIndex: 2,
                        transform: horizontal ? "rotate(-90deg)" : "",
                        marginRight: "5%",
                      }}
                    />
                    <img
                      src={numberValToImg[secondNumber]!}
                      alt={`${secondNumber} chit at position ${i}`}
                      style={{
                        width: "30%",
                        height: `${(30 * HEX_WIDTH) / HEX_HEIGHT}%`,
                        zIndex: 2,
                        transform: horizontal ? "rotate(-90deg)" : "",
                      }}
                    />
                  </div>
                )}
                {port && (
                  <img
                    src={portTypeToImage[port.type]}
                    alt={`${port.type} port at position ${i}`}
                    style={{
                      zIndex: 2,
                      width: HEX_SIZE,
                      height: HEX_SIZE,
                      transform: `rotate(${port.orientation}deg)`,
                      position: "absolute",
                    }}
                  />
                )}
                
              </div>
            )
          )}
        </div>
      </Paper>
    </>
  );
}
