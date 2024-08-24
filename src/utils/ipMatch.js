// Function to check if IPs are equal
function ipMatch(IP1, IP2) {
  if (!IP1) return true;
  if (!IP2) return false;

  // Function to normalize IPv4 address (remove leading zeros)
  function normalizeIPv4Address(address) {
    return address.replace(/(^|\.)(?:0(?!\.|$))+/g, "$1");
  }

  // Function to expand IPv6 address to full format
  function expandIPv6Address(address) {
    let fullAddress = "";
    let expandedAddress = "";
    let validGroupCount = 8;
    let validGroupSize = 4;

    let ipv4 = "";
    const extractIpv4 =
      /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/;
    const validateIpv4 =
      /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;

    if (validateIpv4.test(address)) {
      const oldGroups = address.match(extractIpv4);
      for (let i = 1; i < oldGroups.length; i++) {
        ipv4 +=
          ("00" + parseInt(oldGroups[i], 10).toString(16)).slice(-2) +
          (i == 2 ? ":" : "");
      }
      address = address.replace(extractIpv4, ipv4);
    }

    if (address.indexOf("::") == -1) {
      fullAddress = address;
    } else {
      const sides = address.split("::");
      let groupsPresent = 0;
      sides.forEach((side) => {
        groupsPresent += side.split(":").length;
      });
      fullAddress += sides[0] + ":";
      if (validGroupCount - groupsPresent > 1) {
        fullAddress += "0000:".repeat(validGroupCount - groupsPresent);
      }
      fullAddress += sides[1];
    }
    let groups = fullAddress.split(":");
    for (let i = 0; i < validGroupCount; i++) {
      if (groups[i].length < validGroupSize) {
        groups[i] = "0".repeat(validGroupSize - groups[i].length) + groups[i];
      }
      expandedAddress += i != validGroupCount - 1 ? groups[i] + ":" : groups[i];
    }
    return expandedAddress;
  }

  // Normalize or expand IP addresses
  IP1 = IP1.toLowerCase();
  if (IP1 == "localhost") IP1 = "::1";
  if (IP1.indexOf("::ffff:") == 0) IP1 = IP1.substring(7);
  if (IP1.indexOf(":") > -1) {
    IP1 = expandIPv6Address(IP1);
  } else {
    IP1 = normalizeIPv4Address(IP1);
  }

  IP2 = IP2.toLowerCase();
  if (IP2 == "localhost") IP2 = "::1";
  if (IP2.indexOf("::ffff:") == 0) IP2 = IP2.substring(7);
  if (IP2.indexOf(":") > -1) {
    IP2 = expandIPv6Address(IP2);
  } else {
    IP2 = normalizeIPv4Address(IP2);
  }

  // Check if processed IPs are equal
  if (IP1 == IP2) return true;
  else return false;
}

module.exports = ipMatch;
