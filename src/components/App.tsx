import React, { useState, useEffect, useRef } from "react";
import { Hex } from "../types/hexes";
import Board from "./Board";
import Randomizer from "./Randomizer";
import { EXPANSIONS } from "../data/expansions";
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Autocomplete,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Popper,
  PopperProps,
  Snackbar,
  Alert,
} from "@mui/material";
import { CatanBoard, ExpansionName } from "../types/boards";
import { GitHub } from "@mui/icons-material";
import { Analytics } from "@vercel/analytics/react"

const TopPopper = function (props: PopperProps) {
  return <Popper {...props} placement="top" />;
};


const useComponentWillMount = (cb: () => void) => {
  const willMount = useRef(true);
  if (willMount.current) cb();
  willMount.current = false;
};

function App() {
  const [expansion, setExpansion] = useState<ExpansionName>("Catan");

  useComponentWillMount(() => {
    if (!EXPANSIONS.has(expansion)) setExpansion("Catan");
  });

  const [board, setBoard] = useState<CatanBoard>(
    EXPANSIONS.has(expansion)
      ? EXPANSIONS.get(expansion)!
      : EXPANSIONS.get("Catan")!
  );

  const [hexes, setHexes] = useState<Hex[]>(board.recommendedLayout);
  const [errorSnackOpen, setErrorSnackOpen] = useState(false);
  const [errorMessage] = useState("");

  const handleErrorSnackClose = () => {
    setErrorSnackOpen(false);
  };

  const changeExpansion = (expansion: ExpansionName, hexes?: Hex[]) => {
    if (!EXPANSIONS.has(expansion))
      throw new Error(`Unrecognized expansion "${expansion}"`);
    setExpansion(expansion);
    const newBoard = EXPANSIONS.get(expansion)!;
    setBoard(newBoard);
    setHexes(typeof hexes === "undefined" ? newBoard.recommendedLayout : hexes);
  };

  useEffect(() => {
    if (!EXPANSIONS.has(expansion)) {
      setExpansion("Catan");
    }
  }, [expansion]);

  const theme = createTheme({
    palette: {
      mode: "dark",
    },
    typography: {
      fontFamily: [
        'Nunito',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@global': {
            '@font-face': ['Nunito'],
          },
        },
      },
    },
  });

  return (
    
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Analytics />
      <div
        id="app"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Board {...{ hexes, board }} />
        <Paper
          elevation={20}
          className="nunitofont"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Tooltip
            title={
              "Choose the Catan expansion to use. The default for each is" +
              " the recommended beginner setup"
            }
            placement="bottom"
            arrow
            disableInteractive
          >
            <Autocomplete
              style={{
                margin: 10,
                marginBottom: 0,
                width: "min(80vw, 400px)",
              }}
              PopperComponent={TopPopper}
              options={Array.from(EXPANSIONS.keys()).sort()}
              renderInput={(params) => (
                <TextField 
                  {...params}
                  label="Base Map or Extension"
                />
              )}
              value={expansion}
              onChange={(_, value) => {
                if (value !== null) changeExpansion(value);
              }}
              autoComplete
            />
          </Tooltip>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              padding: 5,
            }}
          >
            <Randomizer {...{ setHexes, board, expansion }} />
            <Tooltip
              title="See the code on github.com"
              placement="top"
              arrow
              disableInteractive
            >
              <IconButton
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/hemilpatel971/catan-board-generator"
              >
                <GitHub />
              </IconButton>
            </Tooltip>
          </div>
        </Paper>
      </div>

      {/* Error snackbar */}
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
    </ThemeProvider>
  );
}

export default App;
