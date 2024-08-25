const sizify = require('../../src/utils/sizify');

describe('"sizify" function', () => {
  test('should return "0" for 0 bytes', () => {
    expect(sizify(0)).toBe('0');
  });

  test('should handle negative bytes', () => {
    expect(sizify(-1024)).toBe('1K');
  });

  test('should return correct size for small values', () => {
    expect(sizify(1000)).toBe('1000');
    expect(sizify(1024)).toBe('1K');
  });

  test('should return correct size for larger values', () => {
    expect(sizify(1048576)).toBe('1M');
    expect(sizify(1073741824)).toBe('1G');
    expect(sizify(1099511627776)).toBe('1T');
    expect(sizify(1125899906842624)).toBe('1P');
    expect(sizify(1152921504606846976)).toBe('1E');
    expect(sizify(1180591620717411303424)).toBe('1Z');
    expect(sizify(1208925819614629174706176)).toBe('1Y');
    expect(sizify(1237940039285380274899124224)).toBe('1R');
    expect(sizify(1267650600228229401496703205376)).toBe('1Q');
  });

  test('should handle very large values', () => {
    const largeValue = 2 ** 100; // A very large number
    expect(sizify(largeValue)).toBe('1Q');
  });

  test('should add "i" suffix when addI is true', () => {
    expect(sizify(1024, true)).toBe('1Ki');
    expect(sizify(1048576, true)).toBe('1Mi');
    expect(sizify(1073741824, true)).toBe('1Gi');
  });

  test('should not add "i" suffix when addI is false', () => {
    expect(sizify(1024, false)).toBe('1K');
    expect(sizify(1048576, false)).toBe('1M');
    expect(sizify(1073741824, false)).toBe('1G');
  });

  test('should handle decimal points correctly', () => {
    expect(sizify(1500)).toBe('1.47K');
    expect(sizify(1500000)).toBe('1.44M');
    expect(sizify(1500000000)).toBe('1.4G');
  });

  test('should handle edge cases', () => {
    expect(sizify(1)).toBe('1');
    expect(sizify(1023)).toBe('1023');
    expect(sizify(1025)).toBe('1.01K');
  });
});
