import React from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Madrigal crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
          <h1 className="font-display gilded text-4xl">By the king's beard...</h1>
          <p className="font-serif max-w-md text-parchment">
            The game has met an untimely end. {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border border-gold bg-burgundy px-6 py-2 font-display text-parchment hover:bg-burgundy-dark"
          >
            Reload the realm
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
