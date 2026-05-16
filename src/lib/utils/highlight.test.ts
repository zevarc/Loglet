import { describe, expect, it } from 'vitest';
import { compileSearchRegex, splitByRegex } from './highlight';

describe('splitByRegex', () => {
  it('returns the whole text when there is no match', () => {
    const out = splitByRegex('hello world', /xyz/g);
    expect(out).toEqual([{ text: 'hello world', match: false }]);
  });

  it('splits around a single match', () => {
    const out = splitByRegex('hello world', /world/g);
    expect(out).toEqual([
      { text: 'hello ', match: false },
      { text: 'world', match: true }
    ]);
  });

  it('splits around multiple matches', () => {
    const out = splitByRegex('a-b-c-d', /-/g);
    expect(out.length).toBe(7);
    expect(out.filter((s) => s.match).length).toBe(3);
  });

  it('handles a match at the start', () => {
    const out = splitByRegex('xxxhello', /xxx/g);
    expect(out).toEqual([
      { text: 'xxx', match: true },
      { text: 'hello', match: false }
    ]);
  });

  it('handles a match at the end', () => {
    const out = splitByRegex('hello xxx', /xxx/g);
    expect(out).toEqual([
      { text: 'hello ', match: false },
      { text: 'xxx', match: true }
    ]);
  });

  it('synthesizes the g flag if missing', () => {
    const out = splitByRegex('aaa', /a/);
    expect(out.filter((s) => s.match).length).toBe(3);
  });

  it('terminates on a zero-width pattern', () => {
    expect(() => splitByRegex('abc', /^/g)).not.toThrow();
  });

  it('empty text returns empty list', () => {
    expect(splitByRegex('', /x/g)).toEqual([]);
  });
});

describe('compileSearchRegex', () => {
  it('returns null for empty query', () => {
    expect(compileSearchRegex('', { regex: false, caseSensitive: false })).toBeNull();
  });

  it('escapes metachars in substring mode', () => {
    const re = compileSearchRegex('a.b', { regex: false, caseSensitive: false })!;
    expect(re.test('a.b')).toBe(true);
    expect(re.test('aXb')).toBe(false); // dot is literal
  });

  it('passes regex mode through', () => {
    const re = compileSearchRegex('a.b', { regex: true, caseSensitive: false })!;
    expect(re.test('a.b')).toBe(true);
    expect(re.test('aXb')).toBe(true); // dot is a wildcard
  });

  it('case-sensitive flag respected', () => {
    const re = compileSearchRegex('foo', { regex: false, caseSensitive: true })!;
    expect(re.test('foo')).toBe(true);
    expect(re.test('FOO')).toBe(false);
  });

  it('returns null on invalid regex', () => {
    expect(compileSearchRegex('[abc', { regex: true, caseSensitive: false })).toBeNull();
  });
});
