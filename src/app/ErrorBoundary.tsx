import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort safety net at the app root. Without this, any uncaught error
 * during render/a state update (e.g. a browser API throwing somewhere deep
 * inside a setInterval tick) unmounts the entire React tree — with the
 * dark theme's near-black body background, that reads as a plain "tela
 * preta" with no way back except force-closing the app. This turns that
 * into a recoverable screen instead, and — because Timer/Simulado progress
 * is now autosaved as it happens (see useTimer.ts / quizDraft.ts) — a
 * reload from here loses nothing that wasn't already safely persisted.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro não tratado no app:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary-card">
          <h1 className="error-boundary-title">Ops, algo deu errado</h1>
          <p className="error-boundary-message">
            Não se preocupe — seu progresso já estava sendo salvo automaticamente. Toque abaixo para recarregar.
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={18} /> Recarregar
          </button>
        </div>
      </div>
    );
  }
}
