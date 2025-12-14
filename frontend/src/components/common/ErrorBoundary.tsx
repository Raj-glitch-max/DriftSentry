'use client';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error to monitoring service (placeholder for production)
        console.error('ErrorBoundary caught an error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });

        // In production, you would send to error tracking service:
        // errorTrackingService.captureException(error, { extra: errorInfo });
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                An unexpected error occurred. Please try again.
                            </p>

                            {process.env.NODE_ENV !== 'production' && this.state.error && (
                                <details className="text-left bg-gray-100 dark:bg-gray-700 rounded p-3 mb-4 text-sm">
                                    <summary className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                                        Error Details
                                    </summary>
                                    <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                                        {this.state.error.message}
                                        {this.state.error.stack && `\n\n${this.state.error.stack}`}
                                    </pre>
                                </details>
                            )}

                            <button
                                onClick={this.handleRetry}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
