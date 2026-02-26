import React, { useState, useRef } from 'react'
import { fmtNum, fmtPct, fmtX, getScoreBand } from '../utils/calculations'

const RATING_COLORS = {
  green: { bg: 'var(--success-bg)', border: 'var(--success-border)', text: 'var(--success)' },
  amber: { bg: 'var(--warning-bg)', border: 'var(--warning-border)', text: 'var(--warning)' },
  red: { bg: 'var(--danger-bg)', border: 'var(--danger-border)', text: 'var(--danger)' },
}

export default function Step4({ eligibleBonds, analyses, drsSettings, onBack, onRestart }) {
  const [activeTab, setActiveTab] = useState(0)
  const memoRef = useRef(null)

  const bond = eligibleBonds[activeTab]
  const analysis = bond ? analyses[bond.id] : null

  if (!analysis) return null

  const { ratios, scores, adjustments, adjustmentTotal, stressTest, safeguards, finalScore, tpRating, buyListEligible } = analysis
  const fd = bond._financialData || {}
  const ratingColors = RATING_COLORS[tpRating.colorClass]
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  function handlePrint() {
    window.print()
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.pageTitle}>Output Summary</h1>
        <p style={s.pageSubtitle}>Final TP Rating, risk profile, and credit analysis memo</p>
        <div style={s.headerActions} className="no-print">
          <button style={{ ...s.btn, ...s.btnSecondary }} onClick={onBack}>← Back to Analysis</button>
          <button style={{ ...s.btn, ...s.btnGhost }} onClick={handlePrint}>🖨 Print / Export</button>
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={onRestart}>⟳ New Analysis</button>
        </div>
      </div>

      {/* Bond Tabs */}
      {eligibleBonds.length > 1 && (
        <div style={s.tabs} className="no-print">
          {eligibleBonds.map((b, idx) => {
            const a = analyses[b.id]
            const rc = a ? RATING_COLORS[a.tpRating.colorClass] : {}
            return (
              <button key={b.id}
                style={{ ...s.tab, ...(activeTab === idx ? s.tabActive : {}) }}
                onClick={() => setActiveTab(idx)}>
                {b.issuerName}
                {a && (
                  <span style={{ ...s.tabRating, background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                    {a.tpRating.rating}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ===== DASHBOARD ===== */}
      <div ref={memoRef}>
        {/* Rating Banner */}
        <div style={{ ...s.ratingBanner, background: ratingColors.bg, borderColor: ratingColors.border }}>
          <div style={s.ratingLeft}>
            <div style={s.ratingCircle}>
              <span style={{ ...s.ratingNumber, color: ratingColors.text }}>{tpRating.rating}</span>
            </div>
            <div>
              <div style={{ ...s.ratingLabel, color: ratingColors.text }}>TP Rating {tpRating.rating}</div>
              <div style={{ ...s.ratingDesc, color: ratingColors.text }}>{tpRating.label}</div>
              <div style={s.ratingScore}>Final Score: <strong>{finalScore.toFixed(3)}</strong></div>
            </div>
          </div>
          <div style={s.ratingRight}>
            <div style={{
              ...s.buyBadge,
              background: buyListEligible ? 'var(--success-bg)' : 'var(--danger-bg)',
              border: `1px solid ${buyListEligible ? 'var(--success-border)' : 'var(--danger-border)'}`,
              color: buyListEligible ? 'var(--success)' : 'var(--danger)',
            }}>
              {buyListEligible ? '✓ BUY LIST ELIGIBLE' : '✗ NOT BUY LIST ELIGIBLE'}
            </div>
            <div style={s.buyCondition}>
              {buyListEligible
                ? 'TP Rating ≤ 3 and stress test passed'
                : tpRating.rating > 3
                  ? `TP Rating ${tpRating.rating} exceeds maximum of 3`
                  : 'Stress test failed (Stressed TE/TA < 2.5%)'}
            </div>
            {bond.isin && <div style={s.isinDisplay}>{bond.isin}</div>}
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={s.metricsRow}>
          {[
            { label: 'Pillar A', name: 'Asset Quality', score: scores.pillarA, weight: '40%' },
            { label: 'Pillar B', name: 'Capital & Leverage', score: scores.pillarB, weight: '25%' },
            { label: 'Pillar C', name: 'Funding & Debt', score: scores.pillarC, weight: '20%' },
            { label: 'Pillar D', name: 'Profitability', score: scores.pillarD, weight: '15%' },
          ].map(p => {
            const band = getScoreBand(Math.round(p.score))
            return (
              <div key={p.label} style={{ ...s.metricCard, borderTop: `3px solid ${band.color}` }}>
                <div style={s.metricTop}>
                  <span style={s.metricLabel}>{p.label}</span>
                  <span style={{ ...s.metricScore, color: band.color }}>{p.score.toFixed(2)}</span>
                </div>
                <div style={s.metricName}>{p.name}</div>
                <div style={{ ...s.metricBand, color: band.color }}>{band.label}</div>
                <div style={s.metricWeight}>Weight {p.weight}</div>
              </div>
            )
          })}
        </div>

        {/* Key Ratios + Stress */}
        <div style={s.twoCol}>
          {/* Key Ratios */}
          <div style={s.card}>
            <div style={s.cardHeader}><h3 style={s.cardTitle}>Key Financial Ratios</h3></div>
            <div style={s.cardBody}>
              {[
                { label: 'TE / TA', value: fmtPct(ratios.teta), score: scores.tetaScore },
                { label: '(TA + Cash) / Total Debt', value: fmtX(ratios.taToDebt), score: scores.taDebtScore },
                { label: 'Net Debt / Tangible Equity', value: fmtX(ratios.netDebtToTE), score: scores.netDebtTEScore },
                { label: 'Cash / Total Debt', value: fmtPct(ratios.cashToDebt), score: scores.cashDebtScore },
                { label: 'Interest Cover', value: fmtX(ratios.interestCover), score: scores.interestCoverScore },
                { label: 'NIM', value: fmtPct(ratios.nim), score: scores.nimScore },
                { label: 'Cost-to-Income', value: fmtPct(ratios.cir), score: scores.cirScore },
                ...(fd.accountingStandard === 'IFRS 9' ? [
                  { label: 'Stage 3 Ratio', value: fmtPct(ratios.stage3Ratio), score: scores.stage3Score },
                  { label: 'Stage 2 Ratio', value: fmtPct(ratios.stage2Ratio), score: scores.stage2Score },
                ] : [
                  { label: 'Impaired Ratio', value: fmtPct(ratios.impairedRatio), score: scores.impairedScore },
                ]),
              ].map(r => {
                const band = r.score !== null ? getScoreBand(r.score) : null
                return (
                  <div key={r.label} style={s.ratioRow}>
                    <span style={s.ratioLabel}>{r.label}</span>
                    <div style={s.ratioRight}>
                      <span style={s.ratioValue}>{r.value}</span>
                      {band && (
                        <span style={{ ...s.ratioScore, background: band.color + '18', color: band.color }}>
                          {r.score}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stress + Adjustments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={s.card}>
              <div style={s.cardHeader}><h3 style={s.cardTitle}>Stress Test Result</h3></div>
              <div style={s.cardBody}>
                <div style={s.stressPanel}>
                  <div style={s.stressItem}>
                    <span style={s.stressKey}>Incremental Stressed Exposure</span>
                    <span style={s.stressVal}>{fmtNum(stressTest.incrementalExposure)}</span>
                  </div>
                  <div style={s.stressItem}>
                    <span style={s.stressKey}>Estimated Stress Loss (30% LGD)</span>
                    <span style={s.stressVal}>{fmtNum(stressTest.estimatedStressLoss)}</span>
                  </div>
                  <div style={s.stressItem}>
                    <span style={s.stressKey}>Stressed Tangible Equity</span>
                    <span style={s.stressVal}>{fmtNum(stressTest.stressedTE)}</span>
                  </div>
                  <div style={{ ...s.stressItem, ...s.stressHL }}>
                    <span style={s.stressKey}>Stressed TE/TA</span>
                    <span style={{ ...s.stressVal, color: stressTest.pass ? 'var(--success)' : 'var(--danger)', fontWeight: 800 }}>
                      {fmtPct(stressTest.stressedTETA)}
                    </span>
                  </div>
                </div>
                <div style={{
                  ...s.stressPill,
                  background: stressTest.pass ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${stressTest.pass ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  color: stressTest.pass ? 'var(--success)' : 'var(--danger)',
                }}>
                  {stressTest.pass ? '✓ STRESS TEST PASSED' : '✗ STRESS TEST FAILED'}
                </div>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}><h3 style={s.cardTitle}>Score Summary</h3></div>
              <div style={s.cardBody}>
                <div style={s.scoreBreakdown}>
                  <div style={s.sbRow}>
                    <span>Base Weighted Score</span>
                    <span style={s.sbVal}>{scores.baseScore.toFixed(3)}</span>
                  </div>
                  {adjustments.map((adj, i) => (
                    <div key={i} style={s.sbRow}>
                      <span style={{ fontSize: 12 }}>{adj.label}</span>
                      <span style={{ ...s.sbVal, color: adj.value > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {adj.value > 0 ? '+' : ''}{adj.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {safeguards.triggered && (
                    <div style={{ ...s.sbRow, color: 'var(--danger)', fontSize: 12 }}>
                      <span>Structural Safeguard Override</span>
                      <span style={s.sbVal}>→ min 4.00</span>
                    </div>
                  )}
                  <div style={{ ...s.sbRow, ...s.sbTotal }}>
                    <span>Final Score</span>
                    <span style={{ ...s.sbVal, color: ratingColors.text, fontSize: 18 }}>{finalScore.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>

            {safeguards.triggered && (
              <div style={s.safeguardSummary}>
                <div style={s.sfTitle}>⚠ Structural Safeguards Triggered</div>
                {safeguards.triggers.map((t, i) => <div key={i} style={s.sfItem}>• {t}</div>)}
              </div>
            )}
          </div>
        </div>

        {/* ===== CREDIT MEMO ===== */}
        <div style={s.memo}>
          <div style={s.memoHeader}>
            <div style={s.memoLogo}>CREDIT ANALYSIS MEMORANDUM</div>
            <div style={s.memoMeta}>
              <div style={s.memoMetaItem}><span style={s.memoKey}>Date:</span> {today}</div>
              <div style={s.memoMetaItem}><span style={s.memoKey}>Issuer:</span> {bond.issuerName}</div>
              {bond.isin && <div style={s.memoMetaItem}><span style={s.memoKey}>ISIN:</span> {bond.isin}</div>}
              <div style={s.memoMetaItem}><span style={s.memoKey}>DRS End Date:</span> {drsSettings.endDate}</div>
              <div style={s.memoMetaItem}><span style={s.memoKey}>TP Rating:</span>
                <span style={{ color: ratingColors.text, fontWeight: 700, marginLeft: 6 }}>
                  {tpRating.rating} — {tpRating.label}
                </span>
              </div>
              <div style={s.memoMetaItem}>
                <span style={s.memoKey}>Recommendation:</span>
                <span style={{
                  marginLeft: 6, fontWeight: 700,
                  color: buyListEligible ? 'var(--success)' : 'var(--danger)',
                }}>
                  {buyListEligible ? 'BUY LIST ELIGIBLE' : 'NOT BUY LIST ELIGIBLE'}
                </span>
              </div>
            </div>
          </div>

          <MemoSection title="1. Executive Summary">
            <p style={s.memoPara}>
              This memorandum presents the credit analysis of <strong>{bond.issuerName}</strong>{bond.isin ? ` (ISIN: ${bond.isin})` : ''}, undertaken within the Defined Return Strategy (DRS) framework with a target end date of <strong>{drsSettings.endDate}</strong> and a minimum target return of <strong>{drsSettings.targetReturn}%</strong>.
            </p>
            <p style={s.memoPara}>
              The bond has been assigned a <strong>TP Rating of {tpRating.rating} ({tpRating.label})</strong>, with a final composite score of <strong>{finalScore.toFixed(3)}</strong>. The bond is <strong>{buyListEligible ? '' : 'NOT '}eligible for inclusion on the Buy List</strong>
              {buyListEligible
                ? ', having satisfied the requirement for a TP Rating of 3 or below and having passed the asset quality stress test.'
                : `, due to ${tpRating.rating > 3 ? `an elevated TP Rating of ${tpRating.rating}` : 'failure of the asset quality stress test'}.`}
            </p>
          </MemoSection>

          <MemoSection title="2. Bond & Issuer Information">
            <table style={s.memoTable}>
              <tbody>
                {[
                  ['Issuer Name', bond.issuerName],
                  ['ISIN', bond.isin || '—'],
                  ['Maturity Date', bond.maturityDate ? new Date(bond.maturityDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                  ['Yield to Maturity', `${bond.ytm}%`],
                  ['Accounting Standard', fd.accountingStandard || '—'],
                  ['Reporting Period End', fd.reportingPeriodEnd || '—'],
                  ['Current Auditor', fd.currentAuditor || '—'],
                  ['Auditor Change (24m)', fd.auditorChange === 'Y' ? 'Yes ⚠' : 'No'],
                  ['Late Filing (>4m)', fd.lateFiling === 'Y' ? 'Yes ⚠' : 'No'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={s.memoTdKey}>{k}</td>
                    <td style={s.memoTdVal}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MemoSection>

          <MemoSection title="3. Financial Analysis">
            <MemoSubSection title={`3.1 Asset Quality — Pillar A (Score: ${scores.pillarA.toFixed(2)}`}>
              <p style={s.memoPara}>
                {fd.accountingStandard === 'IFRS 9'
                  ? `Under IFRS 9 reporting, the Stage 3 ratio stands at ${fmtPct(ratios.stage3Ratio)} (score: ${scores.stage3Score}) and the Stage 2 ratio at ${fmtPct(ratios.stage2Ratio)} (score: ${scores.stage2Score}). The Pillar A score is the maximum of these two metrics at ${scores.pillarA}.`
                  : `Under FRS 102 reporting, the impaired loan ratio stands at ${fmtPct(ratios.impairedRatio)} (score: ${scores.impairedScore}). The Pillar A score is ${scores.pillarA}.`
                }
              </p>
            </MemoSubSection>

            <MemoSubSection title={`3.2 Capital & Leverage — Pillar B (Score: ${scores.pillarB.toFixed(2)})`}>
              <p style={s.memoPara}>
                Tangible Equity of <strong>{fmtNum(ratios.tangibleEquity)}</strong> supports a Tangible Equity / Tangible Assets ratio of <strong>{fmtPct(ratios.teta)}</strong> (score: {scores.tetaScore}). The asset coverage ratio (TA + Cash / Debt) stands at <strong>{fmtX(ratios.taToDebt)}</strong> (score: {scores.taDebtScore}), and Net Debt / Tangible Equity at <strong>{fmtX(ratios.netDebtToTE)}</strong> (score: {scores.netDebtTEScore}). Pillar B is the maximum of these at <strong>{scores.pillarB}</strong>.
              </p>
            </MemoSubSection>

            <MemoSubSection title={`3.3 Funding & Debt Service — Pillar C (Score: ${scores.pillarC.toFixed(2)})`}>
              <p style={s.memoPara}>
                Cash as a proportion of total debt is <strong>{fmtPct(ratios.cashToDebt)}</strong> (score: {scores.cashDebtScore}). Interest cover (EBITDA / Net Interest Expense) stands at <strong>{fmtX(ratios.interestCover)}</strong> (score: {scores.interestCoverScore}). Pillar C score: <strong>{scores.pillarC}</strong>.
              </p>
            </MemoSubSection>

            <MemoSubSection title={`3.4 Profitability — Pillar D (Score: ${scores.pillarD.toFixed(2)})`}>
              <p style={s.memoPara}>
                The net interest margin (NII / Gross Loans) is <strong>{fmtPct(ratios.nim)}</strong> (score: {scores.nimScore}) and the cost-to-income ratio is <strong>{fmtPct(ratios.cir)}</strong> (score: {scores.cirScore}). The average of these two metrics gives a Pillar D score of <strong>{scores.pillarD.toFixed(2)}</strong>.
              </p>
            </MemoSubSection>
          </MemoSection>

          <MemoSection title="4. Composite Scoring">
            <p style={s.memoPara}>
              The base weighted score is calculated as follows:
            </p>
            <div style={s.memoFormula}>
              <div>Base Score = (Pillar A × 40%) + (Pillar B × 25%) + (Pillar C × 20%) + (Pillar D × 15%)</div>
              <div>= ({scores.pillarA.toFixed(2)} × 0.40) + ({scores.pillarB.toFixed(2)} × 0.25) + ({scores.pillarC.toFixed(2)} × 0.20) + ({scores.pillarD.toFixed(2)} × 0.15) = <strong>{scores.baseScore.toFixed(3)}</strong></div>
            </div>
            {adjustments.length > 0 && (
              <>
                <p style={{ ...s.memoPara, marginTop: 12 }}>The following qualitative adjustments were applied:</p>
                <ul style={s.memoList}>
                  {adjustments.map((a, i) => (
                    <li key={i} style={s.memoListItem}>
                      {a.label}: <strong>{a.value > 0 ? '+' : ''}{a.value.toFixed(2)} pts</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {safeguards.triggered && (
              <p style={{ ...s.memoPara, marginTop: 12, color: 'var(--danger)' }}>
                Structural safeguard override applied: final score elevated to a minimum of <strong>4.000</strong> due to: {safeguards.triggers.join('; ')}.
              </p>
            )}
            <p style={{ ...s.memoPara, marginTop: 12 }}>
              The final composite score of <strong>{finalScore.toFixed(3)}</strong> maps to a <strong>TP Rating of {tpRating.rating} ({tpRating.label})</strong>.
            </p>
          </MemoSection>

          <MemoSection title="5. Stress Test">
            <p style={s.memoPara}>
              {fd.accountingStandard === 'IFRS 9'
                ? `An IFRS 9 stress scenario was applied comprising a 40% increase in Stage 3 loans (incremental exposure: ${fmtNum(stressTest.stage3Stress)}) and migration of 40% of Stage 2 loans to Stage 3 (${fmtNum(stressTest.stage2Stress)}), giving a total incremental stressed exposure of ${fmtNum(stressTest.incrementalExposure)}.`
                : `A FRS 102 stress scenario was applied comprising a 40% increase in impaired loans (incremental exposure: ${fmtNum(stressTest.impairedStress)}).`
              }
            </p>
            <p style={s.memoPara}>
              Applying a 30% Loss Given Default assumption yields an estimated stress loss of <strong>{fmtNum(stressTest.estimatedStressLoss)}</strong>. After deducting this from Tangible Equity ({fmtNum(ratios.tangibleEquity)}), the Stressed Tangible Equity is <strong>{fmtNum(stressTest.stressedTE)}</strong>, representing a Stressed TE/TA ratio of <strong>{fmtPct(stressTest.stressedTETA)}</strong>.
            </p>
            <p style={{ ...s.memoPara, fontWeight: 600, color: stressTest.pass ? 'var(--success)' : 'var(--danger)' }}>
              The stress test has been {stressTest.pass ? 'PASSED' : 'FAILED'}. The stressed TE/TA of {fmtPct(stressTest.stressedTETA)} {stressTest.pass ? 'meets' : 'does not meet'} the minimum 2.5% threshold.
            </p>
          </MemoSection>

          <MemoSection title="6. Conclusion & Recommendation">
            <p style={s.memoPara}>
              Based on the foregoing analysis, <strong>{bond.issuerName}</strong> has been assigned a TP Rating of <strong>{tpRating.rating} — {tpRating.label}</strong> (Final Score: {finalScore.toFixed(3)}).
            </p>
            <p style={{ ...s.memoPara, fontWeight: 700, color: buyListEligible ? 'var(--success)' : 'var(--danger)', marginTop: 12 }}>
              RECOMMENDATION: {buyListEligible
                ? `This bond is eligible for inclusion on the DRS Buy List. The issuer demonstrates adequate financial resilience across all four analytical pillars and has passed the asset quality stress test.`
                : `This bond is NOT eligible for inclusion on the DRS Buy List at this time. ${tpRating.rating > 3
                  ? `The TP Rating of ${tpRating.rating} exceeds the maximum permissible rating of 3 for Buy List inclusion.`
                  : 'The bond has failed the asset quality stress test, indicating insufficient capital to absorb a stressed deterioration in asset quality.'}`}
            </p>
            <p style={{ ...s.memoPara, marginTop: 12, color: 'var(--text-muted)', fontSize: 12 }}>
              This analysis is prepared for internal investment decision-making purposes only. It is based solely on the financial data provided and does not constitute financial advice. Ratings are subject to review upon material changes in the issuer's financial position.
            </p>
          </MemoSection>
        </div>
      </div>
    </div>
  )
}

function MemoSection({ title, children }) {
  return (
    <div style={s.memoSection}>
      <h3 style={s.memoSectionTitle}>{title}</h3>
      {children}
    </div>
  )
}

function MemoSubSection({ title, children }) {
  return (
    <div style={s.memoSubSection}>
      <h4 style={s.memoSubTitle}>{title}</h4>
      {children}
    </div>
  )
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  pageTitle: { fontSize: 26, fontWeight: 700, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: 'var(--text-secondary)' },
  headerActions: { display: 'flex', gap: 10, flexShrink: 0 },
  tabs: { display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', overflowX: 'auto' },
  tab: {
    padding: '10px 18px', background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
  },
  tabActive: { color: 'var(--accent-light)', borderBottomColor: 'var(--accent)' },
  tabRating: { padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 800 },
  ratingBanner: {
    padding: '24px 28px', borderRadius: 12, border: '1px solid',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20,
  },
  ratingLeft: { display: 'flex', alignItems: 'center', gap: 20 },
  ratingCircle: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', border: '3px solid currentColor',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  ratingNumber: { fontSize: 36, fontWeight: 900, lineHeight: 1 },
  ratingLabel: { fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 },
  ratingDesc: { fontSize: 26, fontWeight: 800, lineHeight: 1.2 },
  ratingScore: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 },
  ratingRight: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  buyBadge: { padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 800, letterSpacing: '0.05em' },
  buyCondition: { fontSize: 12, color: 'var(--text-secondary)' },
  isinDisplay: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 500 },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  metricCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '16px', display: 'flex', flexDirection: 'column', gap: 4,
  },
  metricTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  metricLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  metricScore: { fontSize: 32, fontWeight: 900, lineHeight: 1 },
  metricName: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 },
  metricBand: { fontSize: 11, fontWeight: 600 },
  metricWeight: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  cardHeader: { padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card-alt)' },
  cardTitle: { fontSize: 14, fontWeight: 700 },
  cardBody: { padding: '16px 20px' },
  ratioRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid var(--border)',
  },
  ratioLabel: { fontSize: 12, color: 'var(--text-secondary)' },
  ratioRight: { display: 'flex', alignItems: 'center', gap: 8 },
  ratioValue: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' },
  ratioScore: { width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  stressPanel: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  stressItem: {
    display: 'flex', justifyContent: 'space-between', padding: '8px 10px',
    background: 'var(--bg-secondary)', borderRadius: 6,
  },
  stressHL: { background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' },
  stressKey: { fontSize: 12, color: 'var(--text-secondary)' },
  stressVal: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' },
  stressPill: { textAlign: 'center', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 13 },
  scoreBreakdown: { display: 'flex', flexDirection: 'column', gap: 6 },
  sbRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 10px', background: 'var(--bg-secondary)', borderRadius: 6,
    fontSize: 12, color: 'var(--text-secondary)',
  },
  sbVal: { fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 },
  sbTotal: { background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)', fontWeight: 700, fontSize: 13 },
  safeguardSummary: {
    padding: '14px 16px', borderRadius: 10,
    background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
  },
  sfTitle: { fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 6 },
  sfItem: { fontSize: 12, color: 'var(--danger)', lineHeight: 1.6, opacity: 0.85 },

  /* Credit Memo */
  memo: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
    marginTop: 8,
  },
  memoHeader: {
    padding: '24px 32px', borderBottom: '2px solid var(--border)',
    background: 'linear-gradient(135deg, #0c1c35 0%, #142038 100%)',
  },
  memoLogo: { fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: 16 },
  memoMeta: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 24px' },
  memoMetaItem: { fontSize: 13, color: 'var(--text-secondary)' },
  memoKey: { fontWeight: 600, color: 'var(--text-primary)', marginRight: 4 },
  memoSection: { padding: '20px 32px', borderBottom: '1px solid var(--border)' },
  memoSectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' },
  memoSubSection: { marginBottom: 16 },
  memoSubTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 },
  memoPara: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 0 },
  memoFormula: {
    background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8,
    fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace',
    lineHeight: 1.8, border: '1px solid var(--border)', marginTop: 8,
  },
  memoList: { margin: '8px 0 0 24px', display: 'flex', flexDirection: 'column', gap: 4 },
  memoListItem: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 },
  memoTable: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  memoTdKey: { padding: '7px 0', color: 'var(--text-muted)', fontWeight: 600, width: '40%', borderBottom: '1px solid var(--border)', paddingRight: 16, verticalAlign: 'top' },
  memoTdVal: { padding: '7px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' },

  btn: {
    padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
  },
  btnPrimary: { background: 'var(--accent)', color: 'white' },
  btnSecondary: { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' },
  btnGhost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
}
