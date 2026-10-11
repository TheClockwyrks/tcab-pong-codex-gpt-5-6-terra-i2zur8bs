import { describe, expect, it } from "vitest";
import { game } from "./game";

function setup() {
  const api = {
    input: { register: () => undefined },
    audio: { define: () => undefined },
    diagnostics: { register: () => undefined },
  };
  return game.initialize(api as never) as [
    import("./game").CaromState,
    import("./game").CaromDebugApi,
  ];
}

describe("Carom debug surface", () => {
  it("creates the documented title world", () => {
    const [state, debug] = setup();
    const snapshot = debug.snapshot(state);
    expect(snapshot.screen).toBe("title");
    expect(snapshot.ball?.held).toBe(true);
    expect(snapshot.obstacles).toHaveLength(2);
    expect(snapshot.version).toBe(1);
  });

  it("can pose and clear the simulation world", () => {
    const [state, debug] = setup();
    const posed = debug.setBallVelocity(
      debug.setBallHeld(state, false),
      520,
      0,
    );
    expect(debug.snapshot(posed).ball?.speed).toBe(520);
    const empty = debug.clearWorld(posed);
    expect(debug.snapshot(empty).ball).toBeNull();
    expect(debug.snapshot(empty).obstacles).toEqual([]);
  });
});
