import { describe, expect, it } from "vitest";
import {
  CITY_GAS_EMISSION_FACTOR_KG_PER_M3,
  ELECTRICITY_EMISSION_FACTOR_KG_PER_KWH,
  calculateScope2,
} from "./scope2";

describe("calculateScope2", () => {
  it("sums electricity and gas contributions", () => {
    const result = calculateScope2({ usageKwh: 287, usageM3: 45 });

    expect(result.electricityCo2Kg).toBeCloseTo(
      287 * ELECTRICITY_EMISSION_FACTOR_KG_PER_KWH,
    );
    expect(result.gasCo2Kg).toBeCloseTo(
      45 * CITY_GAS_EMISSION_FACTOR_KG_PER_M3,
    );
    expect(result.totalCo2Kg).toBeCloseTo(
      result.electricityCo2Kg + result.gasCo2Kg,
    );
  });

  it("treats a missing gas usage as zero contribution", () => {
    const result = calculateScope2({ usageKwh: 287, usageM3: null });

    expect(result.gasCo2Kg).toBe(0);
    expect(result.totalCo2Kg).toBe(result.electricityCo2Kg);
  });

  it("returns zero totals when no usage is available", () => {
    expect(calculateScope2({ usageKwh: null, usageM3: null })).toEqual({
      electricityCo2Kg: 0,
      gasCo2Kg: 0,
      totalCo2Kg: 0,
    });
  });
});
