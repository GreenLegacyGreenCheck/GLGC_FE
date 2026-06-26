// Reference emission factors — commonly-cited approximate figures, not a
// verified live data source. Revisit if a precise source becomes available.
export const ELECTRICITY_EMISSION_FACTOR_KG_PER_KWH = 0.4781;
export const CITY_GAS_EMISSION_FACTOR_KG_PER_M3 = 2.176;

export type Scope2Input = {
  usageKwh: number | null;
  usageM3: number | null;
};

export type Scope2Output = {
  electricityCo2Kg: number;
  gasCo2Kg: number;
  totalCo2Kg: number;
};

export function calculateScope2({
  usageKwh,
  usageM3,
}: Scope2Input): Scope2Output {
  const electricityCo2Kg =
    (usageKwh ?? 0) * ELECTRICITY_EMISSION_FACTOR_KG_PER_KWH;
  const gasCo2Kg = (usageM3 ?? 0) * CITY_GAS_EMISSION_FACTOR_KG_PER_M3;

  return {
    electricityCo2Kg,
    gasCo2Kg,
    totalCo2Kg: electricityCo2Kg + gasCo2Kg,
  };
}
