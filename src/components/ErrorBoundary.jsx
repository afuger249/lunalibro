import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    color: '#1e293b'
                }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>¡Ay caramba!</h1>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#64748b' }}>
                        Something went wrong. Please restart the app.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '1rem 2rem',
                            background: '#8B5CF6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Reload App
                    </button>

                    {/* Optional: Show error details in dev/test builds */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ marginTop: '2rem', textAlign: 'left', background: '#e2e8f0', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxWidth: '100%' }}>
                            <summary>Error Details</summary>
                            <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                {this.state.error && this.state.error.toString()}
                                <br />
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
