// Function to deep clone an object or array
function deepClone(obj, _objectsArray, _clonesArray) {
  if (!_objectsArray) _objectsArray = [];
  if (!_clonesArray) _clonesArray = [];
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

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
      clone[index] = deepClone(item, _objectsArray, _clonesArray);
    });
  } else {
    clone = {};
    _objectsArray.push(obj);
    _clonesArray.push(clone);
    Object.keys(obj).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = deepClone(obj[key], _objectsArray, _clonesArray);
      }
    });
  }

  return clone;
}

module.exports = deepClone;
