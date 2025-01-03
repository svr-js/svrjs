const {
  calculateBroadcastIPv4FromCidr,
  calculateNetworkIPv4FromCidr
} = require("../../src/utils/ipSubnetUtils.js");

describe("IPv4 subnet utilities", () => {
  describe("calculateBroadcastIPv4FromCidr", () => {
    test("should return the broadcast address for a given CIDR", () => {
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/24")).toBe(
        "192.168.1.255"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/25")).toBe(
        "192.168.1.127"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/26")).toBe(
        "192.168.1.63"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/27")).toBe(
        "192.168.1.31"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/28")).toBe(
        "192.168.1.15"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/29")).toBe(
        "192.168.1.7"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/30")).toBe(
        "192.168.1.3"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/31")).toBe(
        "192.168.1.1"
      );
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/32")).toBe(
        "192.168.1.0"
      );
    });

    test("should return null for invalid CIDR notation", () => {
      expect(calculateBroadcastIPv4FromCidr(null)).toBe(null);
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0")).toBe(null);
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/")).toBe(null);
      expect(calculateBroadcastIPv4FromCidr("192.168.1.0/abc")).toBe(null);
    });
  });

  describe("calculateNetworkIPv4FromCidr", () => {
    test("should return the network address for a given CIDR", () => {
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/24")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/25")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/26")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/27")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/28")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/29")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/30")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/31")).toBe(
        "192.168.1.0"
      );
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/32")).toBe(
        "192.168.1.0"
      );
    });

    test("should return null for invalid CIDR notation", () => {
      expect(calculateNetworkIPv4FromCidr(null)).toBe(null);
      expect(calculateNetworkIPv4FromCidr("192.168.1.0")).toBe(null);
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/")).toBe(null);
      expect(calculateNetworkIPv4FromCidr("192.168.1.0/abc")).toBe(null);
    });
  });
});
