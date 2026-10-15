import type { Dispatch } from "react";
import { useEffect } from "react";

import { REVEAL_DURATION_MS } from "../game/constants";
import type { GameAction } from "../game/state";

/**
 * Finish a reveal once the flip animation has had time to run.
 *
 * Called once per board, so moving between boards neither cancels a reveal that
 * is still due nor leaves the board being left behind stuck mid-reveal.
 */
export const useRevealTimer = (
  isRevealing: boolean,
  dispatch: Dispatch<GameAction>,
): void => {
  useEffect(() => {
    if (!isRevealing) {
      return;
    }
    const timeout = window.setTimeout(() => {
      dispatch({ type: "REVEAL_COMPLETE" });
    }, REVEAL_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isRevealing, dispatch]);
};
