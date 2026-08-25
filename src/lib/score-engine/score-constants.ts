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
    chaseShareMultiplier: 175,
    chaseShareCap: 70,
    repeatedSymbolMultiplier: 60,
    repeatedSymbolCap: 30,
  },
  f6: {
    minOrders: 20,
    dailyOrderSoftCap: 2,
    dailyOrderMultiplier: 25,
    sameDayRoundTripMultiplier: 60,
    sameDayRoundTripCap: 30,
    feeDragMultiplier: 80,
    feeDragCap: 40,
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
