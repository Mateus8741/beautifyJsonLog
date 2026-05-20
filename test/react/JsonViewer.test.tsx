import React from 'react';
import { render, screen } from '@testing-library/react';
import { JsonViewer } from '../../src/react/JsonViewer';

describe('<JsonViewer>', () => {
  test('renders a string value', () => {
    render(<JsonViewer value="hello" />);
    expect(screen.getByText('"hello"')).toBeTruthy();
  });

  test('renders a number value', () => {
    render(<JsonViewer value={42} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  test('renders null', () => {
    render(<JsonViewer value={null} />);
    expect(screen.getByText('null')).toBeTruthy();
  });

  test('renders an object key', () => {
    render(<JsonViewer value={{ greeting: 'hi' }} />);
    expect(screen.getByText('"greeting"')).toBeTruthy();
    expect(screen.getByText('"hi"')).toBeTruthy();
  });

  test('renders title when provided', () => {
    render(<JsonViewer title="My Data" value={{ a: 1 }} />);
    expect(screen.getByText('My Data')).toBeTruthy();
  });

  test('omits title element when title is not provided', () => {
    const { container } = render(<JsonViewer value={{ a: 1 }} />);
    expect(container.querySelector('[data-testid="json-viewer-title"]')).toBeNull();
  });

  test('applies plugin before rendering', () => {
    render(
      <JsonViewer
        value={{ secret: 'password' }}
        plugins={[
          node => {
            if (node.kind !== 'object') return node;
            return {
              ...node,
              entries: node.entries.map(e =>
                e.key === 'secret'
                  ? { key: e.key, value: { kind: 'primitive' as const, valueType: 'string' as const, raw: '"[REDACTED]"' } }
                  : e
              ),
            };
          },
        ]}
      />
    );
    expect(screen.getByText('"[REDACTED]"')).toBeTruthy();
    expect(screen.queryByText('"password"')).toBeNull();
  });

  test('accepts custom CssTheme', () => {
    const customTheme = {
      key: 'hotpink', string: 'hotpink', number: 'hotpink', boolean: 'hotpink',
      null: 'hotpink', undefined: 'hotpink', bigint: 'hotpink', date: 'hotpink',
      error: 'hotpink', bracket: 'hotpink', punctuation: 'hotpink',
      circular: 'hotpink', special: 'hotpink',
    };
    const { container } = render(<JsonViewer value="x" theme={customTheme} />);
    const span = container.querySelector('span');
    expect(span?.style.color).toBe('hotpink');
  });

  test('renders boolean true and false', () => {
    render(<JsonViewer value={{ yes: true, no: false }} />);
    expect(screen.getByText('true')).toBeTruthy();
    expect(screen.getByText('false')).toBeTruthy();
  });

  test('renders empty array brackets', () => {
    render(<JsonViewer value={[]} />);
    expect(screen.getByText('[')).toBeTruthy();
    expect(screen.getByText(']')).toBeTruthy();
  });
});
