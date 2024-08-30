function calculateBroadcastIPv4FromCidr(ipWithCidr) {
  // Check if CIDR notation is valid, if it's not, return null
  if (!ipWithCidr) return null;
  const ipCA = ipWithCidr.match(
    /^((?:(?:25[0-5]|(?:2[0-4]|1\d|[1-9]|)\d)\.?\b){4})\/([0-2][0-9]|3[0-2]|[0-9])$/,
  );
  if (!ipCA) return null;

  // Extract IP and mask (numeric format)
  const ip = ipCA[1];
  const mask = parseInt(ipCA[2]);

  return ip
    .split(".")
    .map((num, index) => {
      // Calculate resulting 8-bit
      const power = Math.max(Math.min(mask - index * 8, 8), 0);
      return (
        (parseInt(num) & ((Math.pow(2, power) - 1) << (8 - power))) |
        (Math.pow(2, 8 - power) - 1)
      ).toString();
    })
    .join(".");
}

function calculateNetworkIPv4FromCidr(ipWithCidr) {
  // Check if CIDR notation is valid, if it's not, return null
  if (!ipWithCidr) return null;
  const ipCA = ipWithCidr.match(
    /^((?:(?:25[0-5]|(?:2[0-4]|1\d|[1-9]|)\d)\.?\b){4})\/([0-2][0-9]|3[0-2]|[0-9])$/,
  );
  if (!ipCA) return null;

  // Extract IP and mask (numeric format)
  const ip = ipCA[1];
  const mask = parseInt(ipCA[2]);

  return ip
    .split(".")
    .map((num, index) => {
      // Calculate resulting 8-bit
      const power = Math.max(Math.min(mask - index * 8, 8), 0);
      return (
        parseInt(num) &
        ((Math.pow(2, power) - 1) << (8 - power))
      ).toString();
    })
    .join(".");
}

module.exports = {
  calculateBroadcastIPv4FromCidr: calculateBroadcastIPv4FromCidr,
  calculateNetworkIPv4FromCidr: calculateNetworkIPv4FromCidr,
};
