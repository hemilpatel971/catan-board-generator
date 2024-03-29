
import { shuffle, ShufflingError } from "../logic/shuffle";
import { CatanBoard } from "../types/boards";
import { BinaryConstraints } from "../types/constraints";
import { Hex } from "../types/hexes";

export interface IncomingMessage {
  board: CatanBoard;
  binaryConstraints: BinaryConstraints;
}
export type OutgoingMessage =
  | { messageType: "result"; payload: Hex[] }
  | { messageType: "error"; payload: string };

onmessage = (ev: MessageEvent<IncomingMessage>) => {
  const { board, binaryConstraints } = ev.data;

  try {
    const message: OutgoingMessage = {
      messageType: "result",
      payload: shuffle(board, binaryConstraints),
    };
    postMessage(message);
  } catch (error: unknown) {
    if (error instanceof ShufflingError) {
      const message: OutgoingMessage = {
        messageType: "error",
        payload: error.message,
      };
      postMessage(message);
    } else throw error;
  }
};
