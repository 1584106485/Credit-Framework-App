import React, { useState } from 'react'
import { fmtNum, fmtPct, fmtX, getScoreBand } from '../utils/calculations'

export default function Step3({ eligibleBonds, analyses, onNext, onBack }) {
  const [activeTab, setActiveTab] = useState(0)

  const bond = eligibleBonds[activeTab]
  const analysis = bond ? analyses[bond.id] : null
  const fd = bond?._financialData || {}

  if (!analysis) return null

  const { ratios, scores, adjustments, adjustmentTotal, stressTest, safeguards, finalScore } = analysis
  const isIFRS = fd.accountingStandard === 'IFRS 9'

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.pageTitle}>Analysis & Scoring</h1>
        <p style={s.pageSubtitle}>Automatic calculations derived from financial inputs. All ratios, scores, and stress tests are shown below.</p>
      </div>

      {/* Bond Tabs */}
      {eligibleBonds.length > 1 && (
        <div style={s.tabs}>
          {eligibleBonds.map((b, idx) => (
            <button key={b.id}
              style={{ ...s.tab, ...(activeTab === idx ? s.tabActive : {}) }}
              onClick={() => setActiveTab(idx)}>
              {b.issuerName || `Bond ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Derived Values */}
      <CalcCard title="Derived Balance Sheet Values" subtitle="Calculated from raw balance sheet inputs">
        <div style={s.derivedGrid}>
          <DerivedRow label="Tangible Assets"
            formula={`Total Assets (${fmtNum(ratios.totalAssets)}) − Intangibles (${fmtNum(ratios.intangibles)}) − Goodwill (${fmtNum(ratios.goodwill)}) − Cap Dev (${fmtNum(ratios.capDev)}) − DTA (${fmtNum(ratios.dta)})`}
            value={fmtNum(ratios.tangibleAssets)} />
          <DerivedRow label="Tangible Equity"
            formula={`Total Equity (${fmtNum(ratios.totalEquity)}) − Intangible Total (${fmtNum(ratios.intangibleTotal)})`}
            value={fmtNum(ratios.tangibleEquity)} />
          <DerivedRow label="Net Debt"
            formula={`Total Debt (${fmtNum(ratios.totalDebt)}) − Cash (${fmtNum(ratios.cash)})`}
            value={fmtNum(ratios.netDebt)} />
          {isIFRS ? (
            <>
              <DerivedRow label="Stage 3 Ratio"
                formula={`Stage 3 Loans (${fmtNum(ratios.stage3)}) ÷ Gross Loans (${fmtNum(ratios.grossLoans)})`}
                value={fmtPct(ratios.stage3Ratio)} />
              <DerivedRow label="Stage 2 Ratio"
                formula={`Stage 2 Loans (${fmtNum(ratios.stage2)}) ÷ Gross Loans (${fmtNum(ratios.grossLoans)})`}
                value={fmtPct(ratios.stage2Ratio)} />
            </>
          ) : (
            <DerivedRow label="Impaired Ratio"
              formula={`Impaired Loans (${fmtNum(ratios.impaired)}) ÷ Gross Loans (${fmtNum(ratios.grossLoans)})`}
              value={fmtPct(ratios.impairedRatio)} />
          )}
        </div>
      </CalcCard>

      {/* Ratio Scorecard */}
      <CalcCard title="Ratio Scorecard" subtitle="Each metric is scored 1 (low risk) → 3 (moderate) → 5 (high risk)">
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Metric', 'Value', 'Scoring Bands', 'Score'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Asset Quality */}
              <GroupRow label={`Pillar A — Asset Quality (${fd.accountingStandard || ''})`} colSpan={4} />
              {isIFRS ? (
                <>
                  <ScoreRow label="Stage 3 Ratio" value={fmtPct(ratios.stage3Ratio)}
                    bands="<5% = 1 | 5–10% = 3 | >10% = 5" score={scores.stage3Score} />
                  <ScoreRow label="Stage 2 Ratio" value={fmtPct(ratios.stage2Ratio)}
                    bands="<10% = 1 | 10–20% = 3 | >20% = 5" score={scores.stage2Score} />
                </>
              ) : (
                <ScoreRow label="Impaired Ratio" value={fmtPct(ratios.impairedRatio)}
                  bands="<5% = 1 | 6–12% = 3 | >12% = 5" score={scores.impairedScore} />
              )}

              {/* Capital & Leverage */}
              <GroupRow label="Pillar B — Capital & Leverage" colSpan={4} />
              <ScoreRow label="TE / TA" value={fmtPct(ratios.teta)}
                bands=">6% = 1 | 2.51–6% = 3 | ≤2.5% = 5" score={scores.tetaScore} />
              <ScoreRow label="(TA + Cash) / Total Debt" value={fmtX(ratios.taToDebt)}
                bands=">1.2x = 1 | 1.051–1.2x = 3 | ≤1.05x = 5" score={scores.taDebtScore} />
              <ScoreRow label="Net Debt / Tangible Equity" value={fmtX(ratios.netDebtToTE)}
                bands="<8x = 1 | 8–15x = 3 | >15x = 5" score={scores.netDebtTEScore} />

              {/* Funding & Debt */}
              <GroupRow label="Pillar C — Funding & Debt Service" colSpan={4} />
              <ScoreRow label="Cash / Total Debt" value={fmtPct(ratios.cashToDebt)}
                bands=">12% = 1 | 6–12% = 3 | <6% = 5" score={scores.cashDebtScore} />
              <ScoreRow label="Interest Cover (EBITDA / NIE)" value={fmtX(ratios.interestCover)}
                bands=">1.5x = 1 | 1.1–1.5x = 3 | <1.1x = 5" score={scores.interestCoverScore} />

              {/* Profitability */}
              <GroupRow label="Pillar D — Profitability" colSpan={4} />
              <ScoreRow label="NIM (NII / Gross Loans)" value={fmtPct(ratios.nim)}
                bands=">5% = 1 | 2.5–5% = 3 | <2.5% = 5" score={scores.nimScore} />
              <ScoreRow label="Cost-to-Income (OpEx / OpInc)" value={fmtPct(ratios.cir)}
                bands="<50% = 1 | 55–70% = 3 | >70% = 5" score={scores.cirScore} />
            </tbody>
          </table>
        </div>
      </CalcCard>

      {/* Pillar Scores */}
      <CalcCard title="Pillar Scores & Weighted Base Score"
        subtitle="Pillars A–C use MAX of constituent scores; Pillar D uses AVERAGE">
        <div style={s.pillarGrid}>
          {[
            { label: 'A', name: 'Asset Quality', score: scores.pillarA, weight: '40%',
              detail: isIFRS ? `MAX(Stage 3: ${scores.stage3Score}, Stage 2: ${scores.stage2Score})` : `Impaired: ${scores.impairedScore}` },
            { label: 'B', name: 'Capital & Leverage', score: scores.pillarB, weight: '25%',
              detail: `MAX(TE/TA: ${scores.tetaScore}, TA/Debt: ${scores.taDebtScore}, ND/TE: ${scores.netDebtTEScore})` },
            { label: 'C', name: 'Funding & Debt Service', score: scores.pillarC, weight: '20%',
              detail: `MAX(Cash/Debt: ${scores.cashDebtScore}, Interest Cover: ${scores.interestCoverScore})` },
            { label: 'D', name: 'Profitability', score: scores.pillarD, weight: '15%',
              detail: `AVG(NIM: ${scores.nimScore}, CIR: ${scores.cirScore}) = ${scores.pillarD.toFixed(2)}` },
          ].map(p => {
            const band = getScoreBand(Math.round(p.score))
            return (
              <div key={p.label} style={{ ...s.pillarCard, borderColor: band.color + '40' }}>
                <div style={s.pillarTop}>
                  <div style={{ ...s.pillarLabel, background: band.color + '20', color: band.color }}>
                    Pillar {p.label}
                  </div>
                  <div style={{ ...s.pillarScore, color: band.color }}>
                    {p.score.toFixed(2)}
                  </div>
                </div>
                <div style={s.pillarName}>{p.name}</div>
                <div style={s.pillarWeight}>Weight: {p.weight}</div>
                <div style={s.pillarDetail}>{p.detail}</div>
              </div>
            )
          })}
        </div>

        {/* Formula breakdown */}
        <div style={s.formulaBox}>
          <div style={s.formulaTitle}>Base Weighted Score Calculation</div>
          <div style={s.formulaBody}>
            <span style={s.formulaLine}>
              = (Pillar A × 40%) + (Pillar B × 25%) + (Pillar C × 20%) + (Pillar D × 15%)
            </span>
            <span style={s.formulaLine}>
              = ({scores.pillarA.toFixed(2)} × 0.40) + ({scores.pillarB.toFixed(2)} × 0.25) + ({scores.pillarC.toFixed(2)} × 0.20) + ({scores.pillarD.toFixed(2)} × 0.15)
            </span>
            <span style={s.formulaLine}>
              = {(scores.pillarA * 0.40).toFixed(3)} + {(scores.pillarB * 0.25).toFixed(3)} + {(scores.pillarC * 0.20).toFixed(3)} + {(scores.pillarD * 0.15).toFixed(3)}
            </span>
            <span style={{ ...s.formulaLine, ...s.formulaResult }}>
              = <strong>{scores.baseScore.toFixed(3)}</strong>
            </span>
          </div>
        </div>
      </CalcCard>

      {/* Qualitative Adjustments */}
      <CalcCard title="Qualitative Adjustments" subtitle="Applied to the base score before arriving at the final score">
        <table style={s.adjTable}>
          <thead>
            <tr>
              <th style={s.adjTh}>Adjustment</th>
              <th style={{ ...s.adjTh, textAlign: 'right' }}>Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.adjTd}>Base Weighted Score</td>
              <td style={{ ...s.adjTd, textAlign: 'right', fontWeight: 700 }}>{scores.baseScore.toFixed(3)}</td>
            </tr>
            {adjustments.length === 0 && (
              <tr>
                <td style={s.adjTd} colSpan={2}>
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No qualitative adjustments applicable</span>
                </td>
              </tr>
            )}
            {adjustments.map((adj, i) => (
              <tr key={i}>
                <td style={s.adjTd}>{adj.label}</td>
                <td style={{
                  ...s.adjTd, textAlign: 'right', fontWeight: 700,
                  color: adj.value > 0 ? 'var(--danger)' : 'var(--success)',
                }}>
                  {adj.value > 0 ? '+' : ''}{adj.value.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr style={s.adjTotalRow}>
              <td style={{ ...s.adjTd, fontWeight: 700 }}>Final Score (before structural safeguards)</td>
              <td style={{ ...s.adjTd, textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                {(scores.baseScore + adjustmentTotal).toFixed(3)}
              </td>
            </tr>
          </tbody>
        </table>

        {safeguards.triggered && (
          <div style={s.safeguardBox}>
            <div style={s.safeguardTitle}>⚠ Structural Safeguard Override Applied</div>
            <p style={s.safeguardText}>
              Final score is overridden to minimum <strong>4.000</strong> due to the following triggers:
            </p>
            <ul style={s.safeguardList}>
              {safeguards.triggers.map((t, i) => <li key={i} style={s.safeguardItem}>{t}</li>)}
            </ul>
            <div style={s.safeguardFinal}>Final Score → {finalScore.toFixed(3)}</div>
          </div>
        )}
      </CalcCard>

      {/* Stress Test */}
      <CalcCard title="Stress Test" subtitle="Asset quality stress applied with 30% Loss Given Default (LGD)">
        <div style={s.stressGrid}>
          {isIFRS ? (
            <>
              <StressRow label="Stage 3 Stress (×40% increase)"
                value={fmtNum(stressTest.stage3Stress)} />
              <StressRow label="Stage 2 Migration to Stage 3 (×40%)"
                value={fmtNum(stressTest.stage2Stress)} />
            </>
          ) : (
            <StressRow label="Impaired Loans Stress (×40% increase)"
              value={fmtNum(stressTest.impairedStress)} />
          )}
          <StressRow label="Total Incremental Stressed Exposure"
            value={fmtNum(stressTest.incrementalExposure)} highlight />
          <StressRow label={`Estimated Stress Loss (30% LGD × ${fmtNum(stressTest.incrementalExposure)})`}
            value={fmtNum(stressTest.estimatedStressLoss)} />
          <StressRow label={`Stressed Tangible Equity (${fmtNum(ratios.tangibleEquity)} − ${fmtNum(stressTest.estimatedStressLoss)})`}
            value={fmtNum(stressTest.stressedTE)} />
          <StressRow label={`Stressed TE/TA (${fmtNum(stressTest.stressedTE)} ÷ ${fmtNum(ratios.tangibleAssets)})`}
            value={fmtPct(stressTest.stressedTETA)} highlight />
        </div>
        <div style={{
          ...s.stressResult,
          ...(stressTest.pass ? s.stressPass : s.stressFail),
        }}>
          <span style={s.stressIcon}>{stressTest.pass ? '✓' : '✗'}</span>
          <div>
            <strong>Stress Test {stressTest.pass ? 'PASSED' : 'FAILED'}</strong>
            <div style={s.stressResultDetail}>
              Stressed TE/TA = {fmtPct(stressTest.stressedTETA)} {stressTest.pass ? '≥' : '<'} 2.5% minimum threshold
            </div>
          </div>
        </div>
      </CalcCard>

      {/* Navigation */}
      <div style={s.nav}>
        <button style={{ ...s.btn, ...s.btnSecondary }} onClick={onBack}>← Back to Data Input</button>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={onNext}>View Output Summary →</button>
      </div>
    </div>
  )
}

function CalcCard({ title, subtitle, children }) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <h2 style={s.cardTitle}>{title}</h2>
        {subtitle && <p style={s.cardSubtitle}>{subtitle}</p>}
      </div>
      <div style={s.cardBody}>{children}</div>
    </div>
  )
}

function DerivedRow({ label, formula, value }) {
  return (
    <div style={s.derivedRow}>
      <div style={s.derivedLabel}>{label}</div>
      <div style={s.derivedFormula}>{formula}</div>
      <div style={s.derivedValue}>{value}</div>
    </div>
  )
}

function GroupRow({ label, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} style={s.groupRow}>{label}</td>
    </tr>
  )
}

function ScoreRow({ label, value, bands, score }) {
  const band = score !== null ? getScoreBand(score) : null
  return (
    <tr>
      <td style={s.td}>{label}</td>
      <td style={{ ...s.td, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{value}</td>
      <td style={{ ...s.td, color: 'var(--text-muted)', fontSize: 12 }}>{bands}</td>
      <td style={s.td}>
        {score !== null && band && (
          <span style={{
            ...s.scoreBadge,
            background: band.color + '18',
            color: band.color,
            border: `1px solid ${band.color}40`,
          }}>
            {score}
          </span>
        )}
      </td>
    </tr>
  )
}

function StressRow({ label, value, highlight }) {
  return (
    <div style={{ ...s.stressRow, ...(highlight ? s.stressRowHL : {}) }}>
      <span style={s.stressLabel}>{label}</span>
      <span style={{ ...s.stressValue, ...(highlight ? s.stressValueHL : {}) }}>{value}</span>
    </div>
  )
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  header: {},
  pageTitle: { fontSize: 26, fontWeight: 700, marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: 'var(--text-secondary)' },
  tabs: { display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', overflowX: 'auto' },
  tab: {
    padding: '10px 20px', background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  tabActive: { color: 'var(--accent-light)', borderBottomColor: 'var(--accent)' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  cardHeader: { padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card-alt)' },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: 'var(--text-secondary)' },
  cardBody: { padding: 24 },
  derivedGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  derivedRow: {
    display: 'grid', gridTemplateColumns: '180px 1fr auto',
    gap: 16, alignItems: 'center', padding: '10px 14px',
    background: 'var(--bg-secondary)', borderRadius: 8,
  },
  derivedLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  derivedFormula: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 },
  derivedValue: { fontSize: 15, fontWeight: 700, color: 'var(--accent-light)', textAlign: 'right', whiteSpace: 'nowrap' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)',
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)',
  },
  td: { padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', color: 'var(--text-secondary)' },
  groupRow: {
    padding: '8px 14px', background: 'rgba(37,99,235,0.08)',
    color: 'var(--accent-light)', fontSize: 12, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  scoreBadge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 8, fontSize: 15, fontWeight: 700,
  },
  pillarGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  pillarCard: {
    background: 'var(--bg-secondary)', border: '1px solid', borderRadius: 10, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  pillarTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pillarLabel: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  pillarScore: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  pillarName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  pillarWeight: { fontSize: 11, color: 'var(--text-muted)' },
  pillarDetail: { fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 4 },
  formulaBox: {
    background: 'var(--bg-secondary)', borderRadius: 10, padding: 16,
    border: '1px solid var(--border)',
  },
  formulaTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  formulaBody: { display: 'flex', flexDirection: 'column', gap: 4 },
  formulaLine: { fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' },
  formulaResult: { color: 'var(--accent-light)', fontSize: 16, marginTop: 4 },
  adjTable: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  adjTh: {
    padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)',
    background: 'var(--bg-secondary)', textAlign: 'left',
  },
  adjTd: { padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' },
  adjTotalRow: { background: 'rgba(37,99,235,0.08)' },
  safeguardBox: {
    marginTop: 16, padding: 16, borderRadius: 10,
    background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
  },
  safeguardTitle: { fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 },
  safeguardText: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 },
  safeguardList: { margin: '0 0 12px 20px', display: 'flex', flexDirection: 'column', gap: 4 },
  safeguardItem: { fontSize: 12, color: 'var(--danger)', lineHeight: 1.5 },
  safeguardFinal: { fontSize: 15, fontWeight: 700, color: 'var(--danger)' },
  stressGrid: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  stressRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8,
    gap: 12,
  },
  stressRowHL: { background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' },
  stressLabel: { fontSize: 13, color: 'var(--text-secondary)' },
  stressValue: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' },
  stressValueHL: { color: 'var(--accent-light)', fontSize: 16 },
  stressResult: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 10, border: '1px solid',
  },
  stressPass: { background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success)' },
  stressFail: { background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger)' },
  stressIcon: { fontSize: 24, fontWeight: 700 },
  stressResultDetail: { fontSize: 12, marginTop: 2, opacity: 0.85 },
  nav: { display: 'flex', justifyContent: 'space-between', paddingTop: 8 },
  btn: {
    padding: '11px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
  },
  btnPrimary: { background: 'var(--accent)', color: 'white' },
  btnSecondary: { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' },
}
