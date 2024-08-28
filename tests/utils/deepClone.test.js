const deepClone = require("../../src/utils/deepClone");

describe("Deep cloning function", () => {
  test("should clone a simple object", () => {
    const original = { a: 1, b: 2 };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  test("should clone a nested object", () => {
    const original = { a: 1, b: { c: 2, d: { e: 3 } } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
    expect(cloned.b.d).not.toBe(original.b.d);
  });

  test("should clone an array", () => {
    const original = [1, 2, 3];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  test("should clone an array of objects", () => {
    const original = [{ a: 1 }, { b: 2 }];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[0]).not.toBe(original[0]);
    expect(cloned[1]).not.toBe(original[1]);
  });

  test("should clone an object with arrays", () => {
    const original = { a: [1, 2], b: { c: [3, 4] } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.a).not.toBe(original.a);
    expect(cloned.b).not.toBe(original.b);
    expect(cloned.b.c).not.toBe(original.b.c);
  });

  test("should return the same value for non-objects", () => {
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
    expect(deepClone(42)).toBe(42);
    expect(deepClone("string")).toBe("string");
    expect(deepClone(true)).toBe(true);
  });

  test("should handle circular references", () => {
    const original = {};
    original.self = original;
    const cloned = deepClone(original);
    expect(cloned).not.toBe(original);
    expect(cloned.self).toBe(cloned);
  });

  test("should handle complex nested structures", () => {
    const original = {
      a: 1,
      b: [2, 3, { c: 4 }],
      d: { e: 5, f: [6, { g: 7 }] },
    };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
    expect(cloned.b[2]).not.toBe(original.b[2]);
    expect(cloned.d).not.toBe(original.d);
    expect(cloned.d.f).not.toBe(original.d.f);
    expect(cloned.d.f[1]).not.toBe(original.d.f[1]);
  });
});
