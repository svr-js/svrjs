// Function to deep clone an object or array
function deepClone(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const recurse = (obj, _objectsArray, _clonesArray) => {
    if (!_objectsArray) _objectsArray = [];
    if (!_clonesArray) _clonesArray = [];

    let objectsArrayIndex = _objectsArray.indexOf(obj);
    if (objectsArrayIndex != -1) {
      return _clonesArray[objectsArrayIndex];
    }

    let clone;

    if (Array.isArray(obj)) {
      clone = [];
      _objectsArray.push(obj);
      _clonesArray.push(clone);
      obj.forEach((item, index) => {
        clone[index] = recurse(item, _objectsArray, _clonesArray);
      });
    } else {
      clone = {};
      _objectsArray.push(obj);
      _clonesArray.push(clone);
      Object.keys(obj).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clone[key] =
            typeof obj[key] !== "object" || obj[key] === null
              ? obj[key]
              : recurse(obj[key], _objectsArray, _clonesArray);
        }
      });
    }
    return clone;
  };
  return recurse(obj);
}

module.exports = deepClone;
