import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches JavaScript errors in child components and renders a fallback UI
 * instead of crashing the entire application.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-orange-50/30 px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-2xl text-white">!</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-3">
              Something went wrong
            </h1>
            <p className="text-stone-500 mb-6 text-sm leading-relaxed">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left bg-stone-100 rounded-xl p-4">
                <summary className="text-xs font-semibold text-stone-500 cursor-pointer">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="px-6 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-all"
              >
                Go Home
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
