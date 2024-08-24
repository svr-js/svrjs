const ipMatch = require("../../src/utils/ipMatch");

describe("ipMatch", () => {
  test("should return true if IP1 is empty", () => {
    expect(ipMatch("", "192.168.1.1")).toBe(true);
  });

  test("should return false if IP2 is empty", () => {
    expect(ipMatch("192.168.1.1", "")).toBe(false);
  });

  test("should return true if both IPs are empty", () => {
    expect(ipMatch("", "")).toBe(true);
  });

  test("should return true if both IPs are the same IPv4 address", () => {
    expect(ipMatch("192.168.1.1", "192.168.1.1")).toBe(true);
  });

  test("should return false if IPs are different IPv4 addresses", () => {
    expect(ipMatch("192.168.1.1", "192.168.1.2")).toBe(false);
  });

  test("should normalize IPv4 addresses with leading zeros", () => {
    expect(ipMatch("192.168.001.001", "192.168.1.1")).toBe(true);
  });

  test("should return true if both IPs are the same IPv6 address", () => {
    expect(
      ipMatch(
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        "2001:db8:85a3::8a2e:370:7334",
      ),
    ).toBe(true);
  });

  test("should return false if IPs are different IPv6 addresses", () => {
    expect(
      ipMatch(
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        "2001:db8:85a3::8a2e:370:7335",
      ),
    ).toBe(false);
  });

  test('should expand IPv6 addresses with "::"', () => {
    expect(ipMatch("::1", "0:0:0:0:0:0:0:1")).toBe(true);
  });

  test("should handle IPv6 addresses with embedded IPv4 addresses", () => {
    expect(ipMatch("::ffff:192.168.1.1", "192.168.1.1")).toBe(true);
  });

  test('should handle "localhost" as IPv6 loopback address', () => {
    expect(ipMatch("localhost", "::1")).toBe(true);
  });

  test("should handle mixed case IP addresses", () => {
    expect(ipMatch("192.168.1.1", "192.168.1.1")).toBe(true);
    expect(
      ipMatch("2001:DB8:85A3::8A2E:370:7334", "2001:db8:85a3::8a2e:370:7334"),
    ).toBe(true);
  });

  test("should handle IPv6 addresses with leading zeros", () => {
    expect(
      ipMatch(
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        "2001:db8:85a3::8a2e:370:7334",
      ),
    ).toBe(true);
  });

  test("should handle IPv6 addresses with mixed case and leading zeros", () => {
    expect(
      ipMatch(
        "2001:0DB8:85A3:0000:0000:8A2E:0370:7334",
        "2001:db8:85a3::8a2e:370:7334",
      ),
    ).toBe(true);
  });
});
