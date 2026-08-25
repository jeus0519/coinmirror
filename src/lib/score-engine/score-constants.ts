export const SCORE_BANDS = {
  stable: 80,
  observe: 55,
} as const;

export const SCORE_CONSTANTS = {
  orderMergeWindowMinutes: 30,
  chaseLookbackDays: 90,
  f1: {
    minLossExits: 5,
    minProfitExits: 3,
    holdingAsymmetryMultiplier: 25,
    holdingAsymmetryCapWithoutCurrentPrice: 50,
    deepLossThresholdPct: -20,
    deepLossMultiplier: 60,
    deepLossCapWithoutCurrentPrice: 40,
  },
  f3: {
    minBuyOrders: 10,
    selfReferenceRisePct: 7,
    chaseShareMultiplier: 90,
    chaseShareCap: 50,
    repeatedSymbolMultiplier: 20,
    repeatedSymbolCap: 15,
  },
  f6: {
    minOrders: 20,
    baselineSurgeMultiplier: 30,
    baselineSurgeCap: 30,
    sameDayRoundTripMultiplier: 110,
    sameDayRoundTripCap: 30,
    sameDayRoundTripCapFirstAnalysis: 45,
    feeDragMultiplier: 80,
    feeDragCap: 40,
    feeDragCapFirstAnalysis: 55,
  },
  f8: {
    minBuyOrders: 10,
    minSymbols: 2,
    excessConcentrationMultiplier: 200,
    excessConcentrationCap: 80,
    singleHoldingDayMultiplier: 40,
    singleHoldingDayCap: 20,
  },
} as const;
