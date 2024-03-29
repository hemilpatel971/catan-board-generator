import React, { useEffect, useState } from "react";
import { Hex } from "../types/hexes";
import { BinaryConstraints } from "../types/constraints";
import BinaryConstraintControl from "./BinaryConstraintControl";
import { CatanBoard, ExpansionName } from "../types/boards";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  FormGroup,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from '@mui/icons-material/BarChart';
import { IncomingMessage, OutgoingMessage } from "../threading/shuffleWorker";

interface Props {
  setHexes: React.Dispatch<React.SetStateAction<Hex[]>>;
  board: CatanBoard;
  expansion: ExpansionName;
}

const shuffleWorker = new Worker(
  new URL("../threading/shuffleWorker.ts", import.meta.url)
);

export default function Randomizer({ setHexes, board }: Props) {
  const [binaryConstraints, setBinaryConstraints] = useState<BinaryConstraints>({
    noAdjacentSixEight: true,
    noAdjacentTwoTwelve: true,
    noAdjacentPairs: true,
  });

  const [counts, setCounts] = useState<{
    hills: number;
    mountain: number;
    wood: number;
    sheep: number;
    wheat: number;
  }>({
    hills: 0,
    mountain: 0,
    wood: 0,
    sheep: 0,
    wheat: 0
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [invalidConstraints] = useState(false);
  const [errorSnackOpen, setErrorSnackOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statOpen, setStatOpen] = useState(false);

  const handleStatOpen = () => {
    setStatOpen(true);
  };

  const handleStatClose = () => {
    setStatOpen(false);
  };

  const handleClose = () => {
    if (!invalidConstraints) setDialogOpen(false);
  };

  const handleErrorSnackClose = () => {
    setErrorSnackOpen(false);
  };

  useEffect(() => {
    shuffleWorker.onmessage = (ev: MessageEvent<OutgoingMessage>) => {
      const { messageType, payload } = ev.data;
      switch (messageType) {
        case "result":
          setHexes(payload);
          let newCounts = {
            hills: 0,
            mountain: 0,
            wood: 0,
            sheep: 0,
            wheat: 0
          };
          for (const row of payload) {
            if (row.type !== "sea" && row.type !== "desert") {
              if (row.type in newCounts && typeof row.number === 'number') {
                newCounts[row.type] += (6 - Math.abs(7 - row.number)) / 36;
              }
            }
          }
          // Set the counts state
          setCounts(newCounts);
          break;
        case "error":
          setErrorMessage(payload);
          setErrorSnackOpen(true);
          break;
        default:
          ((_: never): never => {
            throw new Error("never");
          })(messageType);
      }
    };
  }, [setHexes]); // Dependency added if setHexes is used within the effect


  return (
    <>
      {/* Constraints dialog */}
      
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle style={{ textAlign: "center", backgroundColor: "#333", color: "#fff" }}>Settings</DialogTitle>
        <DialogContent
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingBottom: 0,
            fontFamily: "sans-serif"
          }}
        >
          <FormGroup>
            <div
              id="app"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#000000",
                padding: "10px",
                borderRadius: "10px",
              }}
            > 
                <BinaryConstraintControl
                  constraint="noAdjacentSixEight"
                  label={"Allow adjacent 6 and 8"}
                  toolTip={
                    "When this box is checked, the numbers 6 & 8 are allowed" +
                    " to appear next to each other"
                  }
                  constraints={binaryConstraints}
                  setConstraints={setBinaryConstraints}
                />
              <hr style={{ width: "100%", margin: "10px 0", border: "none", borderBottom: "1px solid #fff" }} />
                <BinaryConstraintControl
                  constraint="noAdjacentTwoTwelve"
                  label={"Allow adjacent 2 & 12"}
                  toolTip={
                    "When this box is checked, the numbers 2 & 12 are allowed" +
                    " to appear next to each other"
                  }
                  constraints={binaryConstraints}
                  setConstraints={setBinaryConstraints}
                />
              <hr style={{ width: "100%", margin: "10px 0", border: "none", borderBottom: "1px solid #fff" }} />
              <BinaryConstraintControl
                constraint="noAdjacentPairs"
                label="Allow adjacent number pairs"
                toolTip={
                  "When this box is checked, pairs of the same number are allowed" +
                  " to appear next to each other"
                }
                constraints={binaryConstraints}
                setConstraints={setBinaryConstraints}
              />
            </div>
          </FormGroup>
        </DialogContent>
        <DialogActions
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Tooltip
            title={
              invalidConstraints
                ? "One or more constraints is invalid. Please fix this before closing the dialog"
                : "Close the dialog"
            }
            placement="top"
            arrow
            disableInteractive
          >
            
            <span>
              <Button
                style={{ backgroundColor: "#f44336", color: "#fff" }}
                variant="contained"
                onClick={handleClose}
                disabled={invalidConstraints}
              >
                Close
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>


      <Dialog open={statOpen} onClose={handleStatClose}>
        <DialogTitle style={{ textAlign: "center", backgroundColor: "#333", color: "#fff" }}>Board Statistics</DialogTitle>
        <DialogContent
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 0,
          }}
        >
          <FormGroup>
            <div
              id="app"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#000000",
                padding: "10px",
                borderRadius: "10px",
              }}
            >
              <h3 style={{ marginTop: "0", marginBottom: "0.5rem", color: "#fff" }}>Probability of Collecting Resource per Turn</h3>
              <p style={{ marginTop: "0.25rem", marginBottom: "0.25rem", color: "#fff" }}>
                Probability of ORE: {counts.mountain ? (counts.mountain * 100).toFixed(2) + "%" : "27.77%"}
              </p>
              <hr style={{ width: "100%", borderColor: "#555", margin: "0.5rem 0" }} /> {/* Horizontal line */}
              <p style={{ marginTop: "0.25rem", marginBottom: "0.25rem", color: "#fff" }}>
                Probability of WHEAT: {counts.wheat ? (counts.wheat * 100).toFixed(2) + "%" : "36.11%"}
              </p>
              <hr style={{ width: "100%", borderColor: "#555", margin: "0.5rem 0" }} /> {/* Horizontal line */}
              <p style={{ marginTop: "0.25rem", marginBottom: "0.25rem", color: "#fff" }}>
                Probability of SHEEP: {counts.sheep ? (counts.sheep * 100).toFixed(2) + "%" : "27.77%"}
              </p>
              <hr style={{ width: "100%", borderColor: "#555", margin: "0.5rem 0" }} /> {/* Horizontal line */}
              <p style={{ marginTop: "0.25rem", marginBottom: "0.25rem", color: "#fff" }}>
                Probability of WOOD: {counts.wood ? (counts.wood * 100).toFixed(2) + "%" : "36.11%"}
              </p>
              <hr style={{ width: "100%", borderColor: "#555", margin: "0.5rem 0" }} /> {/* Horizontal line */}
              <p style={{ marginTop: "0.25rem", marginBottom: "0.25rem", color: "#fff" }}>
                Probability of BRICK: {counts.hills ? (counts.hills * 100).toFixed(2) + "%" : "30.55%"}
              </p>
            </div>
          </FormGroup>
        </DialogContent>
        <div style={{ textAlign: "center", marginBottom: 10, marginTop: 10 }}>
          <Button variant="contained" onClick={handleStatClose} style={{ backgroundColor: "#f44336", color: "#fff" }}>
            Close
          </Button>
        </div>
      </Dialog>


      {/* Buttons */}
      <Tooltip
        title="Generate random board with your specification"
        placement="bottom"
        arrow
        disableInteractive
      >
        <Button
          variant="contained"
          style={{ margin: 5, padding: 10, backgroundColor: "#000000", color: "#ffffff" }}
          onClick={() => {
            const message: IncomingMessage = {
              board,
              binaryConstraints,
            };
            shuffleWorker.postMessage(message);
          }}
          disabled={invalidConstraints}
        >
          Randomize!
        </Button>
      </Tooltip>

      <Tooltip
        title="Open constraints settings"
        placement="bottom"
        arrow
        disableInteractive
      >
        <IconButton onClick={() => setDialogOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Tooltip
        title="Open board Statistics"
        placement="bottom"
        arrow
        disableInteractive
      >
        <IconButton onClick={handleStatOpen}>
          <BarChartIcon />
        </IconButton>
      </Tooltip>

      
      <Snackbar
        open={errorSnackOpen}
        onClose={handleErrorSnackClose}
        style={{ maxWidth: 400 }}
      >
        <Alert
          onClose={handleErrorSnackClose}
          severity="error"
          style={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
