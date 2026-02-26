import React, { useState } from 'react'

export function createEmptyFinancial(bond) {
  return {
    // General
    issuerName: bond.issuerName || '',
    accountingStandard: '',
    reportingPeriodEnd: '',
    resultsPublicationDate: '',
    currentAuditor: '',
    auditorChange: '',
    auditorResignation: '',
    lateFiling: '',
    // Balance Sheet
    totalAssets: '',
    totalEquity: '',
    totalDebt: '',
    cashEquivalents: '',
    intangibleAssets: '',
    goodwill: '',
    capitalisedDevTech: '',
    deferredTaxAssets: '',
    // Loan Book
    grossLoans: '',
    stage3Loans: '',
    stage2Loans: '',
    impairedLoans: '',
    bondsSecured: '',
    securedLoanBookPct: '',
    // Income Statement
    netInterestIncome: '',
    operatingIncome: '',
    operatingExpenses: '',
    ebitda: '',
    netInterestExpense: '',
  }
}

export default function Step2({ eligibleBonds, financialData, setFinancialData, onNext, onBack }) {
  const [activeTab, setActiveTab] = useState(0)

  const activeBond = eligibleBonds[activeTab]
  const activeBondId = activeBond?.id
  const fd = financialData[activeBondId] || {}
  const isIFRS = fd.accountingStandard === 'IFRS 9'

  function update(field, value) {
    setFinancialData(prev => ({
      ...prev,
      [activeBondId]: { ...prev[activeBondId], [field]: value },
    }))
  }

  function canProceed() {
    return eligibleBonds.every(b => {
      const d = financialData[b.id] || {}
      return d.accountingStandard && d.totalAssets && d.totalEquity && d.totalDebt &&
        d.grossLoans && d.netInterestIncome && d.operatingIncome && d.ebitda
    })
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.pageTitle}>Financial Data Input</h1>
        <p style={s.pageSubtitle}>
          Enter financial data for each eligible bond. All monetary values should be in the same unit (£000s, £m, etc.).
        </p>
      </div>

      {/* Bond Tabs */}
      {eligibleBonds.length > 1 && (
        <div style={s.tabs}>
          {eligibleBonds.map((bond, idx) => (
            <button
              key={bond.id}
              style={{ ...s.tab, ...(activeTab === idx ? s.tabActive : {}) }}
              onClick={() => setActiveTab(idx)}
            >
              {bond.issuerName || `Bond ${idx + 1}`}
              {financialData[bond.id]?.accountingStandard && <span style={s.tabDot} />}
            </button>
          ))}
        </div>
      )}

      {activeBond && (
        <div style={s.bondForm}>
          {/* Section: General */}
          <FormSection title="General Information" icon="🏢">
            <div style={s.grid2}>
              <Field label="Issuer Name">
                <div style={s.readOnly}>{activeBond.issuerName}</div>
              </Field>
              <Field label="Accounting Standard *">
                <div style={s.radioGroup}>
                  {['IFRS 9', 'FRS 102'].map(std => (
                    <label key={std} style={{ ...s.radioOpt, ...(fd.accountingStandard === std ? s.radioOptActive : {}) }}>
                      <input type="radio" style={{ display: 'none' }} value={std}
                        checked={fd.accountingStandard === std}
                        onChange={() => update('accountingStandard', std)} />
                      {std}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Reporting Period End Date">
                <input type="date" style={s.input} value={fd.reportingPeriodEnd || ''}
                  onChange={e => update('reportingPeriodEnd', e.target.value)} />
              </Field>
              <Field label="Results Publication Date">
                <input type="date" style={s.input} value={fd.resultsPublicationDate || ''}
                  onChange={e => update('resultsPublicationDate', e.target.value)} />
              </Field>
              <Field label="Current Auditor">
                <input style={s.input} value={fd.currentAuditor || ''}
                  placeholder="e.g. KPMG LLP"
                  onChange={e => update('currentAuditor', e.target.value)} />
              </Field>
            </div>
            <div style={{ ...s.grid3, marginTop: 16 }}>
              <YN label="Auditor Change in Last 24 Months?"
                value={fd.auditorChange || ''} onChange={v => update('auditorChange', v)} />
              <YN label="Auditor Resignation in Last 24 Months?"
                value={fd.auditorResignation || ''} onChange={v => update('auditorResignation', v)} />
              <YN label="Late Filing (> 4 months)?"
                value={fd.lateFiling || ''} onChange={v => update('lateFiling', v)} />
            </div>
          </FormSection>

          {/* Section: Balance Sheet */}
          <FormSection title="Balance Sheet" icon="⚖️">
            <div style={s.grid3}>
              <NumField label="Total Assets *" value={fd.totalAssets || ''}
                onChange={v => update('totalAssets', v)} />
              <NumField label="Total Equity *" value={fd.totalEquity || ''}
                onChange={v => update('totalEquity', v)} />
              <NumField label="Total Debt *" value={fd.totalDebt || ''}
                onChange={v => update('totalDebt', v)} />
              <NumField label="Cash & Cash Equivalents" value={fd.cashEquivalents || ''}
                onChange={v => update('cashEquivalents', v)} />
              <NumField label="Intangible Assets" value={fd.intangibleAssets || ''}
                onChange={v => update('intangibleAssets', v)} />
              <NumField label="Goodwill" value={fd.goodwill || ''}
                onChange={v => update('goodwill', v)} />
              <NumField label="Capitalised Dev / Tech Costs" value={fd.capitalisedDevTech || ''}
                onChange={v => update('capitalisedDevTech', v)} />
              <NumField label="Deferred Tax Assets" value={fd.deferredTaxAssets || ''}
                onChange={v => update('deferredTaxAssets', v)} />
            </div>
            <div style={s.calcHint}>
              <strong>Tangible Assets</strong> = Total Assets − Intangible Assets − Goodwill − Capitalised Dev/Tech − Deferred Tax Assets
            </div>
          </FormSection>

          {/* Section: Loan Book */}
          <FormSection title="Loan Book" icon="📋">
            <div style={s.grid3}>
              <NumField label="Gross Loans *" value={fd.grossLoans || ''}
                onChange={v => update('grossLoans', v)} />
              {isIFRS ? (
                <>
                  <NumField label="Stage 3 Loans (IFRS 9) *" value={fd.stage3Loans || ''}
                    onChange={v => update('stage3Loans', v)} />
                  <NumField label="Stage 2 Loans (IFRS 9) *" value={fd.stage2Loans || ''}
                    onChange={v => update('stage2Loans', v)} />
                </>
              ) : fd.accountingStandard === 'FRS 102' ? (
                <NumField label="Impaired Loans (FRS 102) *" value={fd.impairedLoans || ''}
                  onChange={v => update('impairedLoans', v)} />
              ) : (
                <div style={s.stdHint}>Select accounting standard above to reveal the relevant loan book fields</div>
              )}
            </div>
            {fd.accountingStandard && (
              <>
                <div style={s.grid2mt}>
                  <YN label="Are bonds secured?" value={fd.bondsSecured || ''}
                    onChange={v => update('bondsSecured', v)} />
                  <Field label="Secured % of Loan Book">
                    <div style={s.inputWithSuffix}>
                      <input type="number" style={{ ...s.input, paddingRight: 36 }}
                        value={fd.securedLoanBookPct || ''}
                        min={0} max={100} step={0.1}
                        placeholder="e.g. 87.5"
                        onChange={e => update('securedLoanBookPct', e.target.value)} />
                      <span style={s.suffix}>%</span>
                    </div>
                  </Field>
                </div>
                <div style={s.calcHint}>
                  <strong>Security Enhancement</strong> applies (−0.75 pts) if bonds are secured AND secured loan book ≥ 85%
                </div>
              </>
            )}
          </FormSection>

          {/* Section: Income Statement */}
          <FormSection title="Income Statement" icon="📊">
            <div style={s.grid3}>
              <NumField label="Net Interest Income *" value={fd.netInterestIncome || ''}
                onChange={v => update('netInterestIncome', v)} />
              <NumField label="Operating Income *" value={fd.operatingIncome || ''}
                onChange={v => update('operatingIncome', v)} />
              <NumField label="Operating Expenses *" value={fd.operatingExpenses || ''}
                onChange={v => update('operatingExpenses', v)} />
              <NumField label="EBITDA / Operating Profit *" value={fd.ebitda || ''}
                onChange={v => update('ebitda', v)} />
              <NumField label="Net Interest Expense" value={fd.netInterestExpense || ''}
                onChange={v => update('netInterestExpense', v)} />
            </div>
          </FormSection>

          {/* Completion status */}
          <div style={s.completionBar}>
            {eligibleBonds.map((bond, idx) => {
              const d = financialData[bond.id] || {}
              const done = d.accountingStandard && d.totalAssets && d.totalEquity && d.totalDebt &&
                d.grossLoans && d.netInterestIncome && d.operatingIncome && d.ebitda
              return (
                <div key={bond.id} style={{ ...s.completionItem, ...(done ? s.completionDone : {}) }}>
                  <span style={done ? s.doneIcon : s.todoIcon}>{done ? '✓' : '○'}</span>
                  {bond.issuerName || `Bond ${idx + 1}`}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={s.nav}>
        <button style={{ ...s.btn, ...s.btnSecondary }} onClick={onBack}>
          ← Back to Screening
        </button>
        <button
          style={{ ...s.btn, ...s.btnPrimary, ...(!canProceed() ? s.btnDisabled : {}) }}
          onClick={onNext}
          disabled={!canProceed()}
          title={!canProceed() ? 'Complete all required fields (*) for each eligible bond to continue' : ''}
        >
          Calculate & Continue →
        </button>
      </div>

      {!canProceed() && (
        <p style={s.validationHint}>
          * Complete all required fields for each eligible bond before proceeding to analysis.
        </p>
      )}
    </div>
  )
}

function FormSection({ title, icon, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <span style={s.sectionIcon}>{icon}</span>
        <h3 style={s.sectionTitle}>{title}</h3>
      </div>
      <div style={s.sectionBody}>{children}</div>
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

function NumField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        type="number"
        style={s.input}
        value={value}
        step="any"
        placeholder="0"
        onChange={e => onChange(e.target.value)}
      />
    </Field>
  )
}

function YN({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div style={s.radioGroup}>
        {['Y', 'N'].map(v => (
          <label key={v} style={{ ...s.radioOpt, ...(value === v ? s.radioOptActive : {}) }}>
            <input type="radio" style={{ display: 'none' }} value={v}
              checked={value === v} onChange={() => onChange(v)} />
            {v === 'Y' ? 'Yes' : 'No'}
          </label>
        ))}
      </div>
    </Field>
  )
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  header: { paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: 700, marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 },
  tabs: {
    display: 'flex', gap: 4, borderBottom: '1px solid var(--border)',
    overflowX: 'auto', paddingBottom: 0,
  },
  tab: {
    padding: '10px 20px', background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  },
  tabActive: { color: 'var(--accent-light)', borderBottomColor: 'var(--accent)' },
  tabDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' },
  bondForm: { display: 'flex', flexDirection: 'column', gap: 16 },
  section: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  sectionHeader: {
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card-alt)',
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 15, fontWeight: 700 },
  sectionBody: { padding: 20 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  grid2mt: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: 8,
    padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, width: '100%', outline: 'none',
  },
  readOnly: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
  },
  radioGroup: { display: 'flex', gap: 8, marginTop: 2 },
  radioOpt: {
    flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-light)',
    cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
    color: 'var(--text-secondary)', background: 'var(--bg-input)', transition: 'all 0.15s', userSelect: 'none',
  },
  radioOptActive: { background: 'rgba(37,99,235,0.15)', borderColor: 'var(--accent)', color: 'var(--accent-light)' },
  calcHint: {
    marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(37,99,235,0.06)',
    border: '1px solid rgba(37,99,235,0.15)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
  },
  stdHint: {
    padding: '12px', border: '1px dashed var(--border)', borderRadius: 8,
    color: 'var(--text-muted)', fontSize: 13, gridColumn: 'span 2',
  },
  inputWithSuffix: { position: 'relative' },
  suffix: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none',
  },
  completionBar: {
    display: 'flex', gap: 12, flexWrap: 'wrap', padding: '16px 20px',
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
    fontSize: 13,
  },
  completionItem: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    borderRadius: 20, border: '1px solid var(--border)', color: 'var(--text-muted)',
  },
  completionDone: { borderColor: 'var(--success-border)', color: 'var(--success)', background: 'var(--success-bg)' },
  doneIcon: { color: 'var(--success)', fontWeight: 700 },
  todoIcon: { color: 'var(--text-muted)' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  validationHint: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', marginTop: -12 },
  btn: {
    padding: '11px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
  },
  btnPrimary: { background: 'var(--accent)', color: 'white' },
  btnSecondary: { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
}
