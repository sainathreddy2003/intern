import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep this log for production debugging in browser console.
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
          <h2 style={{ marginTop: 0 }}>App failed to render</h2>
          <p style={{ marginBottom: '8px' }}>
            A runtime error occurred while loading the page.
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#f6f8fa',
              border: '1px solid #d0d7de',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
