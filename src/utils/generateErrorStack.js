// Generate V8-style error stack from Error object.
function generateErrorStack(errorObject) {
  // Split the error stack by newlines.
  const errorStack = errorObject.stack ? errorObject.stack.split("\n") : [];

  // If the error stack starts with the error name, return the original stack (it is V8-style then).
  if (
    errorStack.some((errorStackLine) => {
      return errorStackLine.indexOf(errorObject.name) == 0;
    })
  ) {
    return errorObject.stack;
  }

  // Create a new error stack with the error name and code (if available).
  let newErrorStack = [
    errorObject.name +
      (errorObject.code ? ": " + errorObject.code : "") +
      (errorObject.message == "" ? "" : ": " + errorObject.message),
  ];

  // Process each line of the original error stack.
  errorStack.forEach((errorStackLine) => {
    if (errorStackLine != "") {
      // Split the line into function and location parts (if available).
      let errorFrame = errorStackLine.split("@");
      let location = "";
      if (errorFrame.length > 1 && errorFrame[0] == "global code")
        errorFrame.shift();
      if (errorFrame.length > 1) location = errorFrame.pop();
      const func = errorFrame.join("@");

      // Build the new error stack entry with function and location information.
      newErrorStack.push(
        "    at " +
          (func == ""
            ? !location || location == ""
              ? "<anonymous>"
              : location
            : func +
              (!location || location == "" ? "" : " (" + location + ")")),
      );
    }
  });

  // Join the new error stack entries with newlines and return the final stack.
  return newErrorStack.join("\n");
}

module.exports = generateErrorStack;
