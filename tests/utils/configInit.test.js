const configInit = require("../../src/utils/configInit.js");
const deepClone = require("../../src/utils/deepClone.js");
const ipMatch = require("../../src/utils/ipMatch.js");
const matchHostname = require("../../src/utils/matchHostname.js");

jest.mock("../../src/utils/deepClone.js");
jest.mock("../../src/utils/ipMatch.js");
jest.mock("../../src/utils/matchHostname.js");

describe("configInit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return a deep clone of config if configVHost is not present", () => {
    const config = { key: "value" };
    deepClone.mockReturnValue({ key: "value" });

    const result = configInit(config, "example.com", "127.0.0.1");

    expect(deepClone).toHaveBeenCalledWith(config);
    expect(result).toEqual({ key: "value" });
  });

  test("should merge matching virtual host configuration", () => {
    const config = {
      setting: "default",
      configVHost: [
        {
          domain: "example.com",
          setting: "overridden"
        }
      ]
    };
    matchHostname.mockReturnValue(true);

    const result = configInit(config, "example.com", "127.0.0.1");

    expect(matchHostname).toHaveBeenCalledWith("example.com", "example.com");
    expect(result.setting).toBe("overridden");
  });

  test("should merge multiple virtual host properties correctly", () => {
    const config = {
      setting: "default",
      arrayProp: [1, 2],
      objectProp: { a: 1 },
      configVHost: [
        {
          domain: "example.com",
          arrayProp: [3, 4],
          objectProp: { b: 2 }
        }
      ]
    };
    matchHostname.mockReturnValue(true);
    deepClone.mockImplementation((obj) => obj); // Don't actually use deep cloning

    const result = configInit(config, "example.com", "127.0.0.1");

    expect(result.arrayProp).toEqual([1, 2, 3, 4]);
    expect(result.objectProp).toEqual({ a: 1, b: 2 });
  });

  test("should not merge virtual host if domain does not match", () => {
    const config = {
      setting: "default",
      configVHost: [
        {
          domain: "other.com",
          setting: "overridden"
        }
      ]
    };
    matchHostname.mockReturnValue(false);

    const result = configInit(config, "example.com", "127.0.0.1");

    expect(result.setting).toBe("default");
  });

  test("should not merge virtual host if IP does not match", () => {
    const config = {
      setting: "default",
      configVHost: [
        {
          ip: "192.168.1.1",
          setting: "overridden"
        }
      ]
    };
    ipMatch.mockReturnValue(false);

    const result = configInit(config, "example.com", "127.0.0.1");

    expect(result.setting).toBe("default");
  });

  test("should deep clone all merged properties", () => {
    const config = {
      configVHost: [
        {
          domain: "example.com",
          nested: { key: "value" }
        }
      ]
    };
    matchHostname.mockReturnValue(true);
    deepClone.mockImplementation((obj) => JSON.parse(JSON.stringify(obj)));

    const result = configInit(config, "example.com", "127.0.0.1");

    expect(deepClone).toHaveBeenCalledWith(result.nested);
    expect(result.nested).toEqual({ key: "value" });
  });
});
