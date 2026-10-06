import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('shows idle message when no message received', () => {
    render(<App />);
    expect(screen.getByText(/select json text/i)).toBeInTheDocument();
  });

  it('renders JsonViewer when a valid JSON message is posted', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'update', value: '{"hello":"world"}' },
        })
      );
    });
    // JsonViewer renders the key "hello" — defaultCssTheme colors it
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });

  it('shows error when invalid JSON message is posted', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'update', value: '{bad}' },
        })
      );
    });
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it('ignores messages with unknown type', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'other', value: '{}' } })
      );
    });
    expect(screen.getByText(/select json text/i)).toBeInTheDocument();
  });
});
