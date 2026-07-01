import { describe, expect, it } from "vitest";
import {
  REFERENCE_MONTHLY_KWH_MEAN,
  REFERENCE_MONTHLY_KWH_STDDEV,
  classifyUser,
} from "./classification";

describe("classifyUser", () => {
  it("classifies typical household usage as 일반가구", () => {
    const result = classifyUser({
      usageKwh: REFERENCE_MONTHLY_KWH_MEAN,
      contractType: "주택용",
    });

    expect(result.userType).toBe("일반가구");
    expect(result.zScore).toBe(0);
  });

  it("classifies a commercial contract type as 소상공인 regardless of usage", () => {
    const result = classifyUser({ usageKwh: 100, contractType: "일반용" });

    expect(result.userType).toBe("소상공인");
  });

  it("classifies unusually high residential usage as 소상공인", () => {
    const usageKwh =
      REFERENCE_MONTHLY_KWH_MEAN + REFERENCE_MONTHLY_KWH_STDDEV * 2;
    const result = classifyUser({ usageKwh, contractType: "주택용" });

    expect(result.userType).toBe("소상공인");
  });

  it("classifies unusually low usage as 취약계층", () => {
    const usageKwh =
      REFERENCE_MONTHLY_KWH_MEAN - REFERENCE_MONTHLY_KWH_STDDEV * 2;
    const result = classifyUser({ usageKwh, contractType: "주택용" });

    expect(result.userType).toBe("취약계층");
  });

  it("defaults to 일반가구 with a zero z-score when usage is unknown", () => {
    expect(classifyUser({ usageKwh: null, contractType: null })).toEqual({
      userType: "일반가구",
      zScore: 0,
    });
  });

  it("classifies additional business contract types as 소상공인", () => {
    expect(
      classifyUser({ usageKwh: 100, contractType: "사업용" }).userType,
    ).toBe("소상공인");
    expect(
      classifyUser({ usageKwh: 100, contractType: "영업용" }).userType,
    ).toBe("소상공인");
    expect(
      classifyUser({ usageKwh: 100, contractType: "업무용" }).userType,
    ).toBe("소상공인");
  });
});
