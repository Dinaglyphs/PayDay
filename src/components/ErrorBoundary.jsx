import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', padding: 24, flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)' }}>
            Something went wrong
          </div>
          <p style={{
            fontSize: 13, color: 'var(--c-text-3)', textAlign: 'center',
            maxWidth: 360, margin: 0, lineHeight: 1.6,
          }}>
            An unexpected error occurred. Your data is safe — reload to continue.
          </p>
          <button
            className="btn-primary"
            style={{ padding: '9px 24px', fontSize: 13 }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
