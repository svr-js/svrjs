const ipBlockList = require("../../src/utils/ipBlockList.js");

describe("IP block list functionality", () => {
  let blockList;

  beforeEach(() => {
    blockList = ipBlockList([]);
  });

  test("should add and check IPv4 address", () => {
    blockList.add("192.168.1.1");
    expect(blockList.check("192.168.1.1")).toBe(true);
    expect(blockList.check("192.168.1.2")).toBe(false);
  });

  test("should add and check IPv6 address", () => {
    blockList.add("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      true,
    );
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7335")).toBe(
      false,
    );
  });

  test("should add and check IPv4 CIDR block", () => {
    blockList.add("192.168.1.0/24");
    expect(blockList.check("192.168.1.1")).toBe(true);
    expect(blockList.check("192.168.1.255")).toBe(true);
    expect(blockList.check("192.168.2.1")).toBe(false);
  });

  test("should add and check IPv6 CIDR block", () => {
    blockList.add("2001:0db8:85a3::/64");
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      true,
    );
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7335")).toBe(
      true,
    );
    expect(blockList.check("2001:0db8:85a4:0000:0000:8a2e:0370:7334")).toBe(
      false,
    );
  });

  test("should remove IPv4 address", () => {
    blockList.add("192.168.1.1");
    expect(blockList.check("192.168.1.1")).toBe(true);
    blockList.remove("192.168.1.1");
    expect(blockList.check("192.168.1.1")).toBe(false);
  });

  test("should remove IPv6 address", () => {
    blockList.add("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      true,
    );
    blockList.remove("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      false,
    );
  });

  test("should remove IPv4 CIDR block", () => {
    blockList.add("192.168.1.0/24");
    expect(blockList.check("192.168.1.1")).toBe(true);
    blockList.remove("192.168.1.0/24");
    expect(blockList.check("192.168.1.1")).toBe(false);
  });

  test("should remove IPv6 CIDR block", () => {
    blockList.add("2001:0db8:85a3::/64");
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      true,
    );
    blockList.remove("2001:0db8:85a3::/64");
    expect(blockList.check("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      false,
    );
  });

  test("should handle edge cases for IPv4 addresses", () => {
    blockList.add("192.168.1.0/30");
    expect(blockList.check("192.168.1.1")).toBe(true);
    expect(blockList.check("192.168.1.2")).toBe(true);
    expect(blockList.check("192.168.1.3")).toBe(true);
    expect(blockList.check("192.168.1.4")).toBe(false);
  });

  test("should handle edge cases for IPv6 addresses", () => {
    blockList.add("2001:0db8:85a3::/64");
    expect(blockList.check("2001:0db8:85a2:ffff:ffff:ffff:ffff:ffff")).toBe(
      false,
    );
    expect(blockList.check("2001:0db8:85a3:0000:0000:0000:0000:0000")).toBe(
      true,
    );
    expect(blockList.check("2001:0db8:85a3:0000:ffff:ffff:ffff:ffff")).toBe(
      true,
    );
    expect(blockList.check("2001:0db8:85a3:0001:0000:0000:0000:0000")).toBe(
      false,
    );
  });
});
