'use client';
import React from 'react';

type State = { hasError: boolean; error?: unknown };

export default class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, info: unknown) {
    // log in dev for debugging
    console.error('Map runtime error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const msg =
        (this.state.error as any)?.message ??
        String(this.state.error);
      const stack = (this.state.error as any)?.stack;
      return (
        <div className="p-4 text-sm text-red-400">
          <div className="font-semibold">Map failed to load</div>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-red-300">
            {msg}
            {stack ? '\n' + stack : ''}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
