// Function to deep clone an object or array
function deepClone(obj, isFullObject) {
  if (typeof obj !== "object" || obj === null) return obj;

  const cache = new Map();

  const recurse = (item) => {
    if (typeof item !== "object" || item === null) return item;

    if (cache.has(item)) return cache.get(item);

    const clone = Array.isArray(item)
      ? []
      : isFullObject
        ? {}
        : Object.create(null);
    cache.set(item, clone);

    if (Array.isArray(item)) {
      for (let i = 0; i < item.length; i++) {
        clone[i] = recurse(item[i]);
      }
    } else {
      Object.keys(item).forEach((key) => {
        clone[key] = recurse(item[key]);
      });
    }

    return clone;
  };

  return recurse(obj);
}

module.exports = deepClone;
