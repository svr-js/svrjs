const createRegex = require('../../src/utils/createRegex');
const os = require('os');

jest.mock('os', () => ({
  platform: jest.fn(),
}));

describe('createRegex', () => {
  beforeEach(() => {
    os.platform.mockReset();
  });

  test('should throw an error for invalid regular expression', () => {
    expect(() => createRegex('invalid/regex', false)).toThrow('Invalid regular expression: invalid/regex');
  });

  test('should create a regular expression without modifiers', () => {
    const regex = createRegex('/test/', false);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('');
  });

  test('should create a regular expression with modifiers', () => {
    const regex = createRegex('/test/gi', false);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('gi');
  });

  test('should add "i" modifier for paths on Windows', () => {
    os.platform.mockReturnValue('win32');
    const regex = createRegex('/test/', true);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('i');
  });

  test('should not add "i" modifier for paths on non-Windows platforms', () => {
    os.platform.mockReturnValue('linux');
    const regex = createRegex('/test/', true);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('');
  });

  test('should not add "i" modifier if already present', () => {
    os.platform.mockReturnValue('win32');
    const regex = createRegex('/test/i', true);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('i');
  });

  test('should handle escaped characters in the search string', () => {
    const regex = createRegex('/test\\/path/', false);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('test\\/path');
    expect(regex.flags).toBe('');
  });

  test('should handle multiple modifiers', () => {
    const regex = createRegex('/test/gim', false);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('gim');
  });

  test('should handle empty search string', () => {
    const regex = createRegex('/^$/', false);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.source).toBe('^$');
    expect(regex.flags).toBe('');
  });
});
