import { CFG } from "./config.js";

export const appState = {
  lastFile: null,
  options: {
    bg: [...CFG.DEFAULT_BG],
    tolerance: CFG.DEFAULT_TOLERANCE,
    strength: CFG.DEFAULT_STRENGTH
  },
  iccBytes: null,
  iccpChunkData: null
};
