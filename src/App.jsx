import React, { useState, useRef } from 'react'
import StepIndicator from './components/StepIndicator'
import Step1 from './steps/Step1'
import Step2 from './steps/Step2'
import Step3 from './steps/Step3'
import Step4 from './steps/Step4'
import { createEmptyFinancial } from './steps/Step2'
import { runFullAnalysis } from './utils/calculations'

let bondIdCounter = 1

function createEmptyBond() {
  return {
    id: bondIdCounter++,
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

export default function App() {
  const [step, setStep] = useState(1)
  const [drsSettings, setDrsSettings] = useState({
    endDate: '2029-03-16',
    term: 3,
    targetReturn: 7.5,
  })
  const [bonds, setBonds] = useState([createEmptyBond()])
  const [eligibleBonds, setEligibleBonds] = useState([])
  const [financialData, setFinancialData] = useState({})
  const [analyses, setAnalyses] = useState({})

  // ── Navigation ──────────────────────────────────────────────────────────

  function handleStep1Next(eligible) {
    setEligibleBonds(eligible)
    // Initialise financial data entries for any new eligible bonds
    setFinancialData(prev => {
      const next = { ...prev }
      eligible.forEach(b => {
        if (!next[b.id]) {
          next[b.id] = createEmptyFinancial(b)
        }
      })
      return next
    })
    setStep(2)
    window.scrollTo(0, 0)
  }

  function handleStep2Next() {
    // Run analyses for all eligible bonds
    const newAnalyses = {}
    eligibleBonds.forEach(b => {
      const fd = financialData[b.id]
      if (fd) {
        const result = runFullAnalysis(fd)
        newAnalyses[b.id] = result
      }
    })
    setAnalyses(newAnalyses)

    // Attach financial data to each eligible bond for Step3/4 reference
    setEligibleBonds(prev => prev.map(b => ({ ...b, _financialData: financialData[b.id] })))

    setStep(3)
    window.scrollTo(0, 0)
  }

  function handleStep3Next() {
    setStep(4)
    window.scrollTo(0, 0)
  }

  function handleRestart() {
    bondIdCounter = 1
    setStep(1)
    setDrsSettings({ endDate: '2029-03-16', term: 3, targetReturn: 7.5 })
    setBonds([createEmptyBond()])
    setEligibleBonds([])
    setFinancialData({})
    setAnalyses({})
    window.scrollTo(0, 0)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={s.app}>
      {/* Top Bar */}
      <header style={s.topBar}>
        <div style={s.topBarInner}>
          <div style={s.logo}>
            <div style={s.logoMark}>CF</div>
            <div>
              <div style={s.logoName}>Credit Framework</div>
              <div style={s.logoSub}>Analysis Platform</div>
            </div>
          </div>
          <div style={s.topBarRight}>
            <span style={s.topBarLabel}>DRS Target</span>
            <span style={s.topBarValue}>{drsSettings.targetReturn}%</span>
            <span style={s.topBarSep} />
            <span style={s.topBarLabel}>End Date</span>
            <span style={s.topBarValue}>{drsSettings.endDate || '—'}</span>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Step Pages */}
      <main style={s.main}>
        {step === 1 && (
          <Step1
            drsSettings={drsSettings}
            setDrsSettings={setDrsSettings}
            bonds={bonds}
            setBonds={setBonds}
            onNext={handleStep1Next}
          />
        )}
        {step === 2 && (
          <Step2
            eligibleBonds={eligibleBonds}
            financialData={financialData}
            setFinancialData={setFinancialData}
            onNext={handleStep2Next}
            onBack={() => { setStep(1); window.scrollTo(0, 0) }}
          />
        )}
        {step === 3 && (
          <Step3
            eligibleBonds={eligibleBonds}
            analyses={analyses}
            onNext={handleStep3Next}
            onBack={() => { setStep(2); window.scrollTo(0, 0) }}
          />
        )}
        {step === 4 && (
          <Step4
            eligibleBonds={eligibleBonds}
            analyses={analyses}
            drsSettings={drsSettings}
            onBack={() => { setStep(3); window.scrollTo(0, 0) }}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span>Credit Framework Analysis Platform</span>
          <span style={s.footerSep}>·</span>
          <span style={{ color: 'var(--text-muted)' }}>For internal investment decision-making purposes only</span>
        </div>
      </footer>
    </div>
  )
}

const s = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
  },
  topBar: {
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    padding: '14px 0',
  },
  topBarInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 900,
    color: 'white',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  logoName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 11,
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  topBarLabel: {
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  topBarValue: {
    color: 'var(--accent-light)',
    fontWeight: 700,
  },
  topBarSep: {
    width: 1,
    height: 16,
    background: 'var(--border)',
    margin: '0 4px',
  },
  main: {
    flex: 1,
  },
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '14px 0',
    background: 'var(--bg-secondary)',
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  footerSep: {
    color: 'var(--border-light)',
  },
}
