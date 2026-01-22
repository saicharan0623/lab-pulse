import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card fade-in" style={{ width: '100%', maxWidth: '600px' }}>
          <h2 style={{ color: 'var(--error)', marginTop: 0 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <details style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '4px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Error Details</summary>
            <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ width: '100%' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
