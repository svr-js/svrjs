const matchHostname = require('../../src/utils/matchHostname');

describe('matchHostname', () => {
  test('should return true if hostname is undefined', () => {
    expect(matchHostname(undefined, 'example.com')).toBe(true);
  });

  test('should return true if hostname is "*"', () => {
    expect(matchHostname('*', 'example.com')).toBe(true);
  });

  test('should return true if reqHostname matches hostname exactly', () => {
    expect(matchHostname('example.com', 'example.com')).toBe(true);
  });

  test('should return false if reqHostname does not match hostname exactly', () => {
    expect(matchHostname('example.com', 'example.org')).toBe(false);
  });

  test('should return true if hostname starts with "*." and reqHostname matches the root', () => {
    expect(matchHostname('*.example.com', 'sub.example.com')).toBe(true);
  });

  test('should return false if hostname starts with "*." and reqHostname does not match the root', () => {
    expect(matchHostname('*.example.com', 'example.org')).toBe(false);
  });

  test('should return true if hostname starts with "*." and reqHostname is the root', () => {
    expect(matchHostname('*.example.com', 'example.com')).toBe(true);
  });

  test('should return false if hostname is "*."', () => {
    expect(matchHostname('*.', 'example.com')).toBe(false);
  });

  test('should return false if reqHostname is undefined', () => {
    expect(matchHostname('example.com', undefined)).toBe(false);
  });

  test('should return false if hostname does not start with "*." and reqHostname does not match', () => {
    expect(matchHostname('sub.example.com', 'example.com')).toBe(false);
  });

  test('should return true if hostname starts with "*." and reqHostname matches the root with additional subdomains', () => {
    expect(matchHostname('*.example.com', 'sub.sub.example.com')).toBe(true);
  });

  test('should return false if hostname starts with "*." and reqHostname does not match the root with additional subdomains', () => {
    expect(matchHostname('*.example.com', 'sub.sub.example.org')).toBe(false);
  });
});
