// Function to deep clone an object or array
function deepClone(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const objectsArray = [];
  const clonesArray = [];

  const recurse = (obj) => {
    let objectsArrayIndex = -1;

    for (let i = 0; i < objectsArray.length; i++) {
      if (objectsArray[i] == obj) {
        objectsArrayIndex = i;
        break;
      }
    }

    if (objectsArrayIndex != -1) {
      return clonesArray[objectsArrayIndex];
    }

    if (Array.isArray(obj)) {
      const clone = [];
      objectsArray.push(obj);
      clonesArray.push(clone);
      obj.forEach((item, index) => {
        clone[index] =
          typeof item !== "object" || item === null ? item : recurse(item);
      });
      return clone;
    } else {
      const clone = {};
      objectsArray.push(obj);
      clonesArray.push(clone);
      Object.keys(obj).forEach((key) => {
        clone[key] =
          typeof obj[key] !== "object" || obj[key] === null
            ? obj[key]
            : recurse(obj[key]);
      });
      return clone;
    }
  };
  return recurse(obj, objectsArray, clonesArray);
}

module.exports = deepClone;
