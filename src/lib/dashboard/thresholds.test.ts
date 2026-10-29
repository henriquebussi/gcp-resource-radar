import { describe, it, expect } from "vitest";
import { evaluate } from "./thresholds";

describe("threshold evaluation", () => {
  it("higher-is-worse metrics turn yellow at warn and red at crit", () => {
    const t = { warn: 70, crit: 90 };
    expect(evaluate(69, t)).toBe("ok");
    expect(evaluate(70, t)).toBe("warning");
    expect(evaluate(90, t)).toBe("critical");
  });
  it("lower-is-worse metrics (uptime) alert when dropping below", () => {
    const t = { warn: 99.9, crit: 99.5, direction: "below" as const };
    expect(evaluate(99.95, t)).toBe("ok");
    expect(evaluate(99.8, t)).toBe("warning");
    expect(evaluate(99.4, t)).toBe("critical");
  });
});
