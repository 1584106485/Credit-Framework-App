import React, { useState } from 'react'
import { screenBond } from '../utils/calculations'

const MAX_BONDS = 10

function createEmptyBond(id) {
  return {
    id,
    issuerName: '',
    isin: '',
    maturityDate: '',
    ytm: '',
    fixedRateFixedTerm: '',
    consumerLoans: '',
    newSPV: '',
    secured: '',
    esg: '',
    sectorDiversification: '',
  }
}

const CRITERIA_LABELS = [
  'Horizon Match',
  'Fixed Rate & Term',
  'Yield Gate',
  'SPV Check',
  'No Consumer Loans',
  'Secured',
  'ESG Integration',
  'Sector Diversification',
]

export default function Step1({ drsSettings, setDrsSettings, bonds, setBonds, onNext }) {
  const [expandedBond, setExpandedBond] = useState(0)
  const [showScreening, setShowScreening] = useState(false)

  const screeningResults = bonds.map(b => screenBond(b, drsSettings))
  const eligibleCount = screeningResults.filter(r => r.eligible).length

  function addBond() {
    if (bonds.length >= MAX_BONDS) return
    const newId = Date.now()
    setBonds(prev => [...prev, createEmptyBond(newId)])
    setExpandedBond(bonds.length)
  }

  function removeBond(idx) {
    if (bonds.length <= 1) return
    setBonds(prev => prev.filter((_, i) => i !== idx))
    setExpandedBond(Math.max(0, idx - 1))
  }

  function updateBond(idx, field, value) {
    setBonds(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b))
  }

  function handleNext() {
    setShowScreening(true)
    if (eligibleCount > 0) {
      onNext(bonds.filter((_, i) => screeningResults[i].eligible))
    }
  }

  return (
    <div style={s.page}>
      {/* DRS Settings */}
      <section style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>DRS Settings</h2>
          <p style={s.cardSubtitle}>Define the Defined Return Strategy parameters for bond screening</p>
        </div>
        <div style={s.grid3}>
          <Field label="DRS End Date">
            <input
              type="date"
              style={s.input}
              value={drsSettings.endDate}
              onChange={e => setDrsSettings(p => ({ ...p, endDate: e.target.value }))}
            />
          </Field>
          <Field label="DRS Term (years)">
            <input
              type="number"
              style={s.input}
              value={drsSettings.term}
              min={1}
              max={30}
              onChange={e => setDrsSettings(p => ({ ...p, term: e.target.value }))}
            />
          </Field>
          <Field label="DRS Target Return (%)">
            <input
              type="number"
              style={s.input}
              value={drsSettings.targetReturn}
              step={0.1}
              min={0}
              onChange={e => setDrsSettings(p => ({ ...p, targetReturn: e.target.value }))}
            />
          </Field>
        </div>
      </section>

      {/* Bond Entry */}
      <section style={s.card}>
        <div style={{ ...s.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={s.cardTitle}>Bond Candidates</h2>
            <p style={s.cardSubtitle}>Enter up to {MAX_BONDS} bonds for screening against DRS gating criteria</p>
          </div>
          <button
            style={{ ...s.btn, ...s.btnPrimary, ...(bonds.length >= MAX_BONDS ? s.btnDisabled : {}) }}
            onClick={addBond}
            disabled={bonds.length >= MAX_BONDS}
          >
            + Add Bond {bonds.length > 0 && `(${bonds.length}/${MAX_BONDS})`}
          </button>
        </div>

        {bonds.map((bond, idx) => {
          const result = screeningResults[idx]
          const isOpen = expandedBond === idx
          const passCount = result.criteria.filter(c => c.pass).length
          const hasData = bond.issuerName || bond.isin

          return (
            <div
              key={bond.id}
              style={{
                ...s.bondCard,
                ...(result.eligible && showScreening ? s.bondEligible : {}),
                ...(!result.eligible && showScreening && hasData ? s.bondFailed : {}),
              }}
            >
              {/* Bond Header */}
              <div style={s.bondHeader} onClick={() => setExpandedBond(isOpen ? -1 : idx)}>
                <div style={s.bondHeaderLeft}>
                  <div style={s.bondNum}>
                    <span style={s.bondNumText}>{idx + 1}</span>
                  </div>
                  <div>
                    <div style={s.bondName}>
                      {bond.issuerName || `Bond ${idx + 1}`}
                      {bond.isin && <span style={s.isinTag}>{bond.isin}</span>}
                    </div>
                    {bond.maturityDate && (
                      <div style={s.bondMeta}>
                        Maturity: {new Date(bond.maturityDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {bond.ytm && ` · YTM: ${bond.ytm}%`}
                      </div>
                    )}
                  </div>
                </div>
                <div style={s.bondHeaderRight}>
                  {showScreening && hasData && (
                    <span style={{
                      ...s.badge,
                      ...(result.eligible ? s.badgeSuccess : s.badgeDanger),
                    }}>
                      {result.eligible ? '✓ ELIGIBLE' : `✗ ${8 - passCount} FAIL${8 - passCount !== 1 ? 'S' : ''}`}
                    </span>
                  )}
                  <button
                    style={s.chevron}
                    onClick={e => { e.stopPropagation(); setExpandedBond(isOpen ? -1 : idx) }}
                  >
                    {isOpen ? '▲' : '▼'}
                  </button>
                  {bonds.length > 1 && (
                    <button
                      style={s.removeBtn}
                      onClick={e => { e.stopPropagation(); removeBond(idx) }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Bond Form */}
              {isOpen && (
                <div style={s.bondForm}>
                  <div style={s.formDivider} />
                  <div style={s.grid2}>
                    <Field label="Issuer Name *">
                      <input
                        style={s.input}
                        value={bond.issuerName}
                        placeholder="e.g. Acme Finance PLC"
                        onChange={e => updateBond(idx, 'issuerName', e.target.value)}
                      />
                    </Field>
                    <Field label="ISIN">
                      <input
                        style={s.input}
                        value={bond.isin}
                        placeholder="e.g. GB00B63H8491"
                        onChange={e => updateBond(idx, 'isin', e.target.value.toUpperCase())}
                      />
                    </Field>
                    <Field label="Maturity Date *">
                      <input
                        type="date"
                        style={s.input}
                        value={bond.maturityDate}
                        onChange={e => updateBond(idx, 'maturityDate', e.target.value)}
                      />
                    </Field>
                    <Field label="YTM — Yield to Maturity (%) *">
                      <input
                        type="number"
                        style={s.input}
                        value={bond.ytm}
                        step={0.01}
                        placeholder="e.g. 8.25"
                        onChange={e => updateBond(idx, 'ytm', e.target.value)}
                      />
                    </Field>
                  </div>

                  <div style={{ ...s.grid2, marginTop: 16 }}>
                    <YesNo
                      label="Fixed Rate & Fixed Term?"
                      hint="Bond must have both fixed coupon rate and fixed maturity"
                      value={bond.fixedRateFixedTerm}
                      onChange={v => updateBond(idx, 'fixedRateFixedTerm', v)}
                    />
                    <YesNo
                      label="Consumer Loans (issuer has)?"
                      hint="Issuer must NOT have consumer loan exposure — answer No to pass"
                      value={bond.consumerLoans}
                      onChange={v => updateBond(idx, 'consumerLoans', v)}
                    />
                    <YesNo
                      label="New SPV? (< 2 year history)"
                      hint="Must answer No to pass — new SPVs are excluded"
                      value={bond.newSPV}
                      onChange={v => updateBond(idx, 'newSPV', v)}
                    />
                    <YesNo
                      label="Secured (floating charge)?"
                      hint="Bond must be secured with a floating charge over assets"
                      value={bond.secured}
                      onChange={v => updateBond(idx, 'secured', v)}
                    />
                    <YesNo
                      label="ESG Integration?"
                      hint="Issuer must demonstrate ESG integration in its operations"
                      value={bond.esg}
                      onChange={v => updateBond(idx, 'esg', v)}
                    />
                    <YesNo
                      label="Sector Diversification?"
                      hint="Bond must contribute to sector diversification of the portfolio"
                      value={bond.sectorDiversification}
                      onChange={v => updateBond(idx, 'sectorDiversification', v)}
                    />
                  </div>

                  {/* Per-bond screening preview */}
                  {showScreening && (
                    <div style={s.criteriaGrid}>
                      {result.criteria.map(c => (
                        <div key={c.name} style={{ ...s.criteriaItem, ...(c.pass ? s.criteriaPass : s.criteriaFail) }}>
                          <span style={c.pass ? s.passIcon : s.failIcon}>{c.pass ? '✓' : '✗'}</span>
                          <span style={s.criteriaName}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* Gating Results Table */}
      {bonds.some(b => b.issuerName) && (
        <section style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Gating Criteria Results</h2>
            <p style={s.cardSubtitle}>
              {showScreening
                ? `${eligibleCount} of ${bonds.filter(b => b.issuerName).length} bonds are eligible to proceed`
                : 'Click "Run Screening" to evaluate all bonds against the 8 gating criteria'}
            </p>
          </div>

          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, ...s.thSticky }}>Bond</th>
                  {CRITERIA_LABELS.map(c => (
                    <th key={c} style={s.th}>{c}</th>
                  ))}
                  <th style={s.th}>Result</th>
                </tr>
              </thead>
              <tbody>
                {bonds.map((bond, idx) => {
                  if (!bond.issuerName) return null
                  const result = screeningResults[idx]
                  const failed = showScreening && !result.eligible

                  return (
                    <tr key={bond.id} style={failed ? s.trFailed : {}}>
                      <td style={{ ...s.td, ...s.tdSticky }}>
                        <div style={failed ? s.failedText : {}}>
                          <div style={s.bondCellName}>{bond.issuerName}</div>
                          {bond.isin && <div style={s.bondCellIsin}>{bond.isin}</div>}
                        </div>
                      </td>
                      {result.criteria.map(c => (
                        <td key={c.name} style={s.td}>
                          {showScreening ? (
                            <span style={c.pass ? s.cellPass : s.cellFail}>
                              {c.pass ? '✓' : '✗'}
                            </span>
                          ) : (
                            <span style={s.cellPending}>—</span>
                          )}
                        </td>
                      ))}
                      <td style={s.td}>
                        {showScreening ? (
                          <span style={{
                            ...s.badge,
                            ...(result.eligible ? s.badgeSuccess : s.badgeDanger),
                          }}>
                            {result.eligible ? '✓ ELIGIBLE' : '✗ FAILED'}
                          </span>
                        ) : (
                          <span style={s.cellPending}>Pending</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {showScreening && eligibleCount === 0 && (
            <div style={s.alert}>
              <span style={s.alertIcon}>⚠</span>
              <span>No bonds passed all gating criteria. Please review the bond details and criteria above.</span>
            </div>
          )}
        </section>
      )}

      {/* Navigation */}
      <div style={s.nav}>
        {!showScreening ? (
          <button
            style={{ ...s.btn, ...s.btnPrimary }}
            onClick={() => setShowScreening(true)}
          >
            Run Screening →
          </button>
        ) : (
          <button
            style={{
              ...s.btn,
              ...s.btnPrimary,
              ...(eligibleCount === 0 ? s.btnDisabled : {}),
            }}
            onClick={handleNext}
            disabled={eligibleCount === 0}
          >
            Proceed to Financial Analysis ({eligibleCount} eligible bond{eligibleCount !== 1 ? 's' : ''}) →
          </button>
        )}
        {showScreening && (
          <button
            style={{ ...s.btn, ...s.btnSecondary }}
            onClick={() => setShowScreening(false)}
          >
            ← Edit Bonds
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

function YesNo({ label, hint, value, onChange }) {
  return (
    <div style={s.yesnoField}>
      <label style={s.label}>{label}</label>
      {hint && <div style={s.hint}>{hint}</div>}
      <div style={s.yesnoGroup}>
        <label style={{ ...s.yesnoOpt, ...(value === 'yes' ? s.yesnoOptActive : {}) }}>
          <input
            type="radio"
            style={{ display: 'none' }}
            value="yes"
            checked={value === 'yes'}
            onChange={() => onChange('yes')}
          />
          Yes
        </label>
        <label style={{ ...s.yesnoOpt, ...(value === 'no' ? s.yesnoOptActive : {}) }}>
          <input
            type="radio"
            style={{ display: 'none' }}
            value="no"
            checked={value === 'no'}
            onChange={() => onChange('no')}
          />
          No
        </label>
      </div>
    </div>
  )
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: 'var(--text-secondary)' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '20px 24px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  hint: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 2 },
  input: {
    background: 'var(--bg-input)', border: '1px solid var(--border-light)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
    fontSize: 14, width: '100%', outline: 'none',
    transition: 'border-color 0.2s',
  },
  yesnoField: { display: 'flex', flexDirection: 'column', gap: 4 },
  yesnoGroup: { display: 'flex', gap: 8, marginTop: 4 },
  yesnoOpt: {
    flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)',
    cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
    color: 'var(--text-secondary)', background: 'var(--bg-input)', transition: 'all 0.15s',
    userSelect: 'none',
  },
  yesnoOptActive: { background: 'rgba(37,99,235,0.15)', borderColor: 'var(--accent)', color: 'var(--accent-light)' },
  bondCard: {
    border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
    margin: '0 16px 12px', transition: 'border-color 0.2s',
  },
  bondEligible: { borderColor: 'var(--success-border)', background: 'rgba(5,46,27,0.3)' },
  bondFailed: { borderColor: 'var(--danger-border)', background: 'rgba(45,10,10,0.3)', opacity: 0.7 },
  bondHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', cursor: 'pointer', userSelect: 'none',
  },
  bondHeaderLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  bondHeaderRight: { display: 'flex', alignItems: 'center', gap: 10 },
  bondNum: {
    width: 28, height: 28, borderRadius: '50%', background: 'rgba(37,99,235,0.15)',
    border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bondNumText: { fontSize: 12, fontWeight: 700, color: 'var(--accent-light)' },
  bondName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 },
  bondMeta: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  isinTag: {
    fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
    background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 4,
    fontFamily: 'monospace',
  },
  chevron: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 },
  removeBtn: {
    background: 'none', border: '1px solid var(--danger-border)', color: 'var(--danger)',
    borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
  },
  bondForm: { padding: '0 16px 16px' },
  formDivider: { borderTop: '1px solid var(--border)', margin: '0 0 16px' },
  criteriaGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
    marginTop: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8,
  },
  criteriaItem: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
    borderRadius: 6, fontSize: 11, fontWeight: 500,
  },
  criteriaPass: { background: 'rgba(16,185,129,0.1)', color: 'var(--success)' },
  criteriaFail: { background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' },
  passIcon: { fontSize: 14, lineHeight: 1 },
  failIcon: { fontSize: 14, lineHeight: 1 },
  criteriaName: { fontSize: 11, lineHeight: 1.3 },
  badge: {
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    letterSpacing: '0.05em', display: 'inline-block',
  },
  badgeSuccess: { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' },
  badgeDanger: { background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' },
  tableWrapper: { overflowX: 'auto', padding: '0 24px 24px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900, fontSize: 13 },
  th: {
    padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)',
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
    whiteSpace: 'nowrap',
  },
  thSticky: { textAlign: 'left', position: 'sticky', left: 0, zIndex: 1 },
  td: {
    padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  },
  tdSticky: { textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 },
  trFailed: { opacity: 0.55 },
  bondCellName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  bondCellIsin: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' },
  failedText: { textDecoration: 'line-through', opacity: 0.7 },
  cellPass: { color: 'var(--success)', fontWeight: 700, fontSize: 16 },
  cellFail: { color: 'var(--danger)', fontWeight: 700, fontSize: 16 },
  cellPending: { color: 'var(--text-muted)' },
  alert: {
    margin: '0 24px 24px', padding: '12px 16px', borderRadius: 8,
    background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
    color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13,
  },
  alertIcon: { fontSize: 18 },
  nav: {
    display: 'flex', justifyContent: 'flex-end', gap: 12,
    padding: '0 0 16px',
  },
  btn: {
    padding: '11px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s', display: 'inline-flex',
    alignItems: 'center', gap: 6,
  },
  btnPrimary: { background: 'var(--accent)', color: 'white' },
  btnSecondary: { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
}
