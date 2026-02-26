import React from 'react'

const steps = [
  { number: 1, label: 'DRS Settings & Bond Screening' },
  { number: 2, label: 'Financial Data Input' },
  { number: 3, label: 'Analysis & Scoring' },
  { number: 4, label: 'Output Summary' },
]

export default function StepIndicator({ currentStep }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number
          const isActive = currentStep === step.number
          return (
            <React.Fragment key={step.number}>
              <div style={styles.step}>
                <div
                  style={{
                    ...styles.circle,
                    ...(isCompleted ? styles.circleCompleted : {}),
                    ...(isActive ? styles.circleActive : {}),
                    ...(!isCompleted && !isActive ? styles.circleInactive : {}),
                  }}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span style={styles.stepNum}>{step.number}</span>
                  )}
                </div>
                <span
                  style={{
                    ...styles.label,
                    ...(isActive ? styles.labelActive : {}),
                    ...(isCompleted ? styles.labelCompleted : {}),
                  }}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  style={{
                    ...styles.connector,
                    ...(currentStep > step.number ? styles.connectorCompleted : {}),
                  }}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    padding: '20px 0',
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  circleCompleted: {
    background: 'var(--success)',
    border: '2px solid var(--success)',
    color: 'white',
  },
  circleActive: {
    background: 'var(--accent)',
    border: '2px solid var(--accent)',
    color: 'white',
    boxShadow: '0 0 0 4px rgba(37,99,235,0.2)',
  },
  circleInactive: {
    background: 'transparent',
    border: '2px solid var(--border-light)',
    color: 'var(--text-muted)',
  },
  stepNum: {
    fontSize: 13,
    fontWeight: 700,
  },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontWeight: 500,
    maxWidth: 110,
    lineHeight: 1.3,
    transition: 'color 0.3s ease',
  },
  labelActive: {
    color: 'var(--accent-light)',
    fontWeight: 600,
  },
  labelCompleted: {
    color: 'var(--success)',
  },
  connector: {
    flex: 1,
    height: 2,
    background: 'var(--border)',
    margin: '-20px 8px 0 8px',
    transition: 'background 0.3s ease',
    minWidth: 40,
    maxWidth: 80,
  },
  connectorCompleted: {
    background: 'var(--success)',
  },
}
