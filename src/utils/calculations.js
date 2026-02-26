/**
 * Credit Framework Analysis Engine
 * All scoring logic, ratio calculations, and analysis functions
 */

// ─── STEP 1: BOND SCREENING ────────────────────────────────────────────────

export function screenBond(bond, drsSettings) {
  const criteria = []

  // 1. Horizon Match: maturity within 14 days of DRS End Date
  const horizonPass = (() => {
    if (!bond.maturityDate || !drsSettings.endDate) return false
    const maturity = new Date(bond.maturityDate)
    const drsEnd = new Date(drsSettings.endDate)
    const diffDays = Math.abs((maturity.getTime() - drsEnd.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 14
  })()
  criteria.push({ name: 'Horizon Match', pass: horizonPass })

  // 2. Fixed Rate & Fixed Term
  criteria.push({ name: 'Fixed Rate & Term', pass: bond.fixedRateFixedTerm === 'yes' })

  // 3. Yield Gate: YTM >= DRS Target Return
  const ytm = parseFloat(bond.ytm)
  const target = parseFloat(drsSettings.targetReturn)
  criteria.push({ name: 'Yield Gate', pass: !isNaN(ytm) && !isNaN(target) && ytm >= target })

  // 4. SPV Check: must NOT be new SPV
  criteria.push({ name: 'SPV Check', pass: bond.newSPV === 'no' })

  // 5. No Consumer Loans
  criteria.push({ name: 'No Consumer Loans', pass: bond.consumerLoans === 'no' })

  // 6. Secured (floating charge)
  criteria.push({ name: 'Secured', pass: bond.secured === 'yes' })

  // 7. ESG Integration
  criteria.push({ name: 'ESG Integration', pass: bond.esg === 'yes' })

  // 8. Sector Diversification
  criteria.push({ name: 'Sector Diversification', pass: bond.sectorDiversification === 'yes' })

  const eligible = criteria.every(c => c.pass)
  return { criteria, eligible }
}

// ─── STEP 3: RATIO CALCULATIONS ────────────────────────────────────────────

export function calculateRatios(data) {
  const n = v => parseFloat(v) || 0

  const totalAssets = n(data.totalAssets)
  const totalEquity = n(data.totalEquity)
  const totalDebt = n(data.totalDebt)
  const cash = n(data.cashEquivalents)
  const intangibles = n(data.intangibleAssets)
  const goodwill = n(data.goodwill)
  const capDev = n(data.capitalisedDevTech)
  const dta = n(data.deferredTaxAssets)
  const grossLoans = n(data.grossLoans)
  const stage3 = n(data.stage3Loans)
  const stage2 = n(data.stage2Loans)
  const impaired = n(data.impairedLoans)
  const nii = n(data.netInterestIncome)
  const opInc = n(data.operatingIncome)
  const opEx = n(data.operatingExpenses)
  const ebitda = n(data.ebitda)
  const nie = n(data.netInterestExpense)

  const intangibleTotal = intangibles + goodwill + capDev + dta
  const tangibleAssets = totalAssets - intangibleTotal
  const tangibleEquity = totalEquity - intangibleTotal
  const netDebt = totalDebt - cash

  const stage3Ratio = grossLoans > 0 ? stage3 / grossLoans : 0
  const stage2Ratio = grossLoans > 0 ? stage2 / grossLoans : 0
  const impairedRatio = grossLoans > 0 ? impaired / grossLoans : 0

  const teta = tangibleAssets !== 0 ? tangibleEquity / tangibleAssets : 0
  const taToDebt = totalDebt > 0 ? (tangibleAssets + cash) / totalDebt : 0
  const netDebtToTE = tangibleEquity !== 0 ? netDebt / tangibleEquity : 0
  const cashToDebt = totalDebt > 0 ? cash / totalDebt : 0
  const interestCover = nie > 0 ? ebitda / nie : 0
  const nim = grossLoans > 0 ? nii / grossLoans : 0
  const cir = opInc > 0 ? opEx / opInc : 0

  return {
    // Derived balance items
    intangibleTotal, tangibleAssets, tangibleEquity, netDebt,
    // Raw amounts
    totalAssets, totalEquity, totalDebt, cash,
    intangibles, goodwill, capDev, dta,
    grossLoans, stage3, stage2, impaired,
    nii, opInc, opEx, ebitda, nie,
    // Ratios
    stage3Ratio, stage2Ratio, impairedRatio,
    teta, taToDebt, netDebtToTE, cashToDebt,
    interestCover, nim, cir,
  }
}

// ─── SCORING FUNCTIONS ─────────────────────────────────────────────────────

function scoreStage3Ratio(r) {
  const p = r * 100
  if (p < 5) return 1
  if (p <= 10) return 3
  return 5
}

function scoreStage2Ratio(r) {
  const p = r * 100
  if (p < 10) return 1
  if (p <= 20) return 3
  return 5
}

function scoreImpairedRatio(r) {
  const p = r * 100
  if (p < 5) return 1
  if (p <= 12) return 3
  return 5
}

function scoreTETA(r) {
  const p = r * 100
  if (p > 6) return 1
  if (p > 2.5) return 3
  return 5
}

function scoreTADebt(r) {
  if (r > 1.2) return 1
  if (r > 1.05) return 3
  return 5
}

function scoreNetDebtTE(r) {
  if (r < 8) return 1
  if (r <= 15) return 3
  return 5
}

function scoreCashDebt(r) {
  const p = r * 100
  if (p > 12) return 1
  if (p >= 6) return 3
  return 5
}

function scoreInterestCover(r) {
  if (r > 1.5) return 1
  if (r >= 1.1) return 3
  return 5
}

function scoreNIM(r) {
  const p = r * 100
  if (p > 5) return 1
  if (p >= 2.5) return 3
  return 5
}

function scoreCIR(r) {
  const p = r * 100
  if (p < 50) return 1
  if (p <= 70) return 3
  return 5
}

export function getScoreBand(score) {
  if (score === 1) return { label: 'Low Risk', color: '#10b981' }
  if (score === 3) return { label: 'Moderate', color: '#f59e0b' }
  return { label: 'High Risk', color: '#ef4444' }
}

// ─── PILLAR SCORES ─────────────────────────────────────────────────────────

export function calculateScores(ratios, data) {
  const isIFRS = data.accountingStandard === 'IFRS 9'

  const stage3Score = isIFRS ? scoreStage3Ratio(ratios.stage3Ratio) : null
  const stage2Score = isIFRS ? scoreStage2Ratio(ratios.stage2Ratio) : null
  const impairedScore = !isIFRS ? scoreImpairedRatio(ratios.impairedRatio) : null

  const tetaScore = scoreTETA(ratios.teta)
  const taDebtScore = scoreTADebt(ratios.taToDebt)
  const netDebtTEScore = scoreNetDebtTE(ratios.netDebtToTE)
  const cashDebtScore = scoreCashDebt(ratios.cashToDebt)
  const interestCoverScore = scoreInterestCover(ratios.interestCover)
  const nimScore = scoreNIM(ratios.nim)
  const cirScore = scoreCIR(ratios.cir)

  // Pillar A: Asset Quality — MAX of applicable scores
  const pillarA = isIFRS
    ? Math.max(stage3Score, stage2Score)
    : impairedScore

  // Pillar B: Capital & Leverage — MAX
  const pillarB = Math.max(tetaScore, taDebtScore, netDebtTEScore)

  // Pillar C: Funding & Debt Service — MAX
  const pillarC = Math.max(cashDebtScore, interestCoverScore)

  // Pillar D: Profitability — AVERAGE
  const pillarD = (nimScore + cirScore) / 2

  // Base Weighted Score
  const baseScore = (pillarA * 0.40) + (pillarB * 0.25) + (pillarC * 0.20) + (pillarD * 0.15)

  return {
    stage3Score, stage2Score, impairedScore,
    tetaScore, taDebtScore, netDebtTEScore,
    cashDebtScore, interestCoverScore,
    nimScore, cirScore,
    pillarA, pillarB, pillarC, pillarD,
    baseScore,
  }
}

// ─── QUALITATIVE ADJUSTMENTS ───────────────────────────────────────────────

export function calculateAdjustments(data) {
  const adjustments = []
  let total = 0

  if (data.accountingStandard === 'FRS 102') {
    adjustments.push({ label: 'FRS 102 Opacity Penalty', value: +0.25, type: 'penalty' })
    total += 0.25
  }

  const govReasons = []
  if (data.auditorChange === 'Y') govReasons.push('auditor change')
  if (data.auditorResignation === 'Y') govReasons.push('auditor resignation')
  if (data.lateFiling === 'Y') govReasons.push('late filing >4 months')
  if (govReasons.length > 0) {
    adjustments.push({
      label: `Governance Penalty (${govReasons.join('; ')})`,
      value: +0.50,
      type: 'penalty',
    })
    total += 0.50
  }

  const securedPct = parseFloat(data.securedLoanBookPct) || 0
  if (data.bondsSecured === 'Y' && securedPct >= 85) {
    adjustments.push({
      label: `Security Enhancement (${securedPct}% secured loan book)`,
      value: -0.75,
      type: 'enhancement',
    })
    total -= 0.75
  }

  return { adjustments, total }
}

// ─── STRESS TEST ───────────────────────────────────────────────────────────

export function calculateStressTest(data, ratios) {
  const isIFRS = data.accountingStandard === 'IFRS 9'
  const n = v => parseFloat(v) || 0

  let incrementalExposure = 0
  let stage3Stress = 0
  let stage2Stress = 0
  let impairedStress = 0

  if (isIFRS) {
    stage3Stress = n(data.stage3Loans) * 0.40
    stage2Stress = n(data.stage2Loans) * 0.40
    incrementalExposure = stage3Stress + stage2Stress
  } else {
    impairedStress = n(data.impairedLoans) * 0.40
    incrementalExposure = impairedStress
  }

  const lgd = 0.30
  const estimatedStressLoss = incrementalExposure * lgd
  const stressedTE = ratios.tangibleEquity - estimatedStressLoss
  const stressedTETA = ratios.tangibleAssets !== 0 ? stressedTE / ratios.tangibleAssets : 0
  const pass = stressedTETA >= 0.025

  return {
    isIFRS,
    stage3Stress, stage2Stress, impairedStress,
    incrementalExposure,
    lgd,
    estimatedStressLoss,
    stressedTE,
    stressedTETA,
    pass,
  }
}

// ─── STRUCTURAL SAFEGUARDS ─────────────────────────────────────────────────

export function applyStructuralSafeguards(scores, ratios, stressTest) {
  const triggers = []

  if (scores.pillarA === 5) {
    triggers.push('Asset Quality Pillar score = 5 (highest risk band)')
  }

  const tetaPct = ratios.teta * 100
  if (tetaPct < 4.5) {
    triggers.push(`TE/TA = ${tetaPct.toFixed(2)}% is below the 4.5% minimum threshold`)
  }

  const highScoringPillars = [scores.pillarA, scores.pillarB, scores.pillarC, Math.round(scores.pillarD)]
    .filter(p => p >= 4)
  if (highScoringPillars.length >= 2) {
    triggers.push(`${highScoringPillars.length} pillar scores ≥ 4 (maximum 1 permitted)`)
  }

  if (!stressTest.pass) {
    triggers.push(`Stressed TE/TA = ${(stressTest.stressedTETA * 100).toFixed(2)}% is below the 2.5% minimum`)
  }

  return { triggered: triggers.length > 0, triggers }
}

// ─── TP RATING MAPPING ─────────────────────────────────────────────────────

export function mapToTPRating(score) {
  if (score <= 1.5) return { rating: 1, label: 'Low Risk', colorClass: 'green' }
  if (score <= 2.5) return { rating: 2, label: 'Moderate-Low Risk', colorClass: 'green' }
  if (score <= 3.5) return { rating: 3, label: 'Moderate Risk', colorClass: 'amber' }
  if (score <= 4.5) return { rating: 4, label: 'Elevated Risk', colorClass: 'red' }
  return { rating: 5, label: 'High Risk', colorClass: 'red' }
}

// ─── FULL ANALYSIS ─────────────────────────────────────────────────────────

export function runFullAnalysis(financialData) {
  const ratios = calculateRatios(financialData)
  const scores = calculateScores(ratios, financialData)
  const { adjustments, total: adjustmentTotal } = calculateAdjustments(financialData)
  const stressTest = calculateStressTest(financialData, ratios)
  const safeguards = applyStructuralSafeguards(scores, ratios, stressTest)

  let finalScore = scores.baseScore + adjustmentTotal
  if (safeguards.triggered) {
    finalScore = Math.max(finalScore, 4.0)
  }

  const tpRating = mapToTPRating(finalScore)
  const buyListEligible = tpRating.rating <= 3 && stressTest.pass

  return {
    ratios,
    scores,
    adjustments,
    adjustmentTotal,
    stressTest,
    safeguards,
    finalScore,
    tpRating,
    buyListEligible,
  }
}

// ─── FORMATTING HELPERS ────────────────────────────────────────────────────

export function fmtNum(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return n.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtPct(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return `${(n * 100).toFixed(decimals)}%`
}

export function fmtX(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return `${n.toFixed(decimals)}x`
}
