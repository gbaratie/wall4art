import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorAlert } from './ErrorAlert';
import { Button } from './ui';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg p-8">
          <ErrorAlert
            error={this.state.error}
            title="Une erreur inattendue s'est produite"
          />
          <Button
            className="mt-4"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Recharger la page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
