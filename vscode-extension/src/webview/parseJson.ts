export type ViewState =
  | { kind: 'empty' }
  | { kind: 'valid'; value: unknown }
  | { kind: 'error'; message: string };

export function parseJson(text: string): ViewState {
  if (!text.trim()) return { kind: 'empty' };
  try {
    return { kind: 'valid', value: JSON.parse(text) };
  } catch (e) {
    return { kind: 'error', message: (e as Error).message };
  }
}
