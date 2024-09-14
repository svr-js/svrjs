// IP Block list object
function ipBlockList(rawBlockList) {
  // Initialize the instance with empty arrays
  if (rawBlockList === undefined) rawBlockList = [];
  const instance = {
    raw: [],
    rawtoPreparedMap: [],
    prepared: [],
    cidrs: []
  };

  // Function to normalize IPv4 address (remove leading zeros)
  const normalizeIPv4Address = (address) =>
    address.replace(/(^|\.)(?:0(?!\.|$))+/g, "$1");

  // Function to expand IPv6 address to full format
  const expandIPv6Address = (address) => {
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
  };

  // Convert IPv4 address to an integer representation
  const ipv4ToInt = (ip) => {
    const ips = ip.split(".");
    return (
      parseInt(ips[0]) * 16777216 +
      parseInt(ips[1]) * 65536 +
      parseInt(ips[2]) * 256 +
      parseInt(ips[3])
    );
  };

  // Get IPv4 CIDR block limits (min and max)
  const getIPv4CIDRLimits = (ip, cidrMask) => {
    const ipInt = ipv4ToInt(ip);
    const exp = Math.pow(2, 32 - cidrMask);
    const ipMin = Math.floor(ipInt / exp) * exp;
    const ipMax = ipMin + exp - 1;
    return {
      min: ipMin,
      max: ipMax
    };
  };

  // Convert IPv6 address to an array of blocks
  const ipv6ToBlocks = (ip) => {
    const ips = ip.split(":");
    let ip2s = [];
    ips.forEach((ipe) => {
      ip2s.push(parseInt(ipe, 16));
    });
    return ip2s;
  };

  // Get IPv6 CIDR block limits (min and max)
  const getIPv6CIDRLimits = (ip, cidrMask) => {
    const ipBlocks = ipv6ToBlocks(ip);
    const fieldsToDelete = Math.floor((128 - cidrMask) / 16);
    const fieldMaskModify = (128 - cidrMask) % 16;
    let ipBlockMin = [];
    let ipBlockMax = [];
    for (let i = 0; i < 8; i++) {
      ipBlockMin.push(
        i < 8 - fieldsToDelete
          ? i < 7 - fieldsToDelete
            ? ipBlocks[i]
            : (ipBlocks[i] >> fieldMaskModify) << fieldMaskModify
          : 0
      );
    }
    for (let i = 0; i < 8; i++) {
      ipBlockMax.push(
        i < 8 - fieldsToDelete
          ? i < 7 - fieldsToDelete
            ? ipBlocks[i]
            : ((ipBlocks[i] >> fieldMaskModify) << fieldMaskModify) +
              Math.pow(2, fieldMaskModify) -
              1
          : 65535
      );
    }
    return {
      min: ipBlockMin,
      max: ipBlockMax
    };
  };

  // Check if the IPv4 address matches the given CIDR block
  const checkIfIPv4CIDRMatches = (ipInt, cidrObject) => {
    if (cidrObject.v6) return false;
    return ipInt >= cidrObject.min && ipInt <= cidrObject.max;
  };

  // Check if the IPv6 address matches the given CIDR block
  const checkIfIPv6CIDRMatches = (ipBlock, cidrObject) => {
    if (!cidrObject.v6) return false;
    for (let i = 0; i < 8; i++) {
      if (ipBlock[i] < cidrObject.min[i] || ipBlock[i] > cidrObject.max[i])
        return false;
    }
    return true;
  };

  // Function to add an IP or CIDR block to the block list
  instance.add = (rawValue) => {
    // Add to raw block list
    instance.raw.push(rawValue);

    // Initialize variables
    const beginIndex = instance.prepared.length;
    const cidrIndex = instance.cidrs.length;
    let cidrMask = null;
    let isIPv6 = false;

    // Check if the input contains CIDR notation
    if (rawValue.indexOf("/") > -1) {
      const rwArray = rawValue.split("/");
      cidrMask = rwArray.pop();
      rawValue = rwArray.join("/");
    }

    // Normalize the IP address or expand the IPv6 address
    rawValue = rawValue.toLowerCase();
    if (rawValue.indexOf("::ffff:") == 0) rawValue = rawValue.substring(7);
    if (rawValue.indexOf(":") > -1) {
      isIPv6 = true;
      rawValue = expandIPv6Address(rawValue);
    } else {
      rawValue = normalizeIPv4Address(rawValue);
    }

    // Add the IP or CIDR block to the appropriate list
    if (cidrMask) {
      let cidrLimits = {};
      if (isIPv6) {
        cidrLimits = getIPv6CIDRLimits(rawValue, cidrMask);
        cidrLimits.v6 = true;
      } else {
        cidrLimits = getIPv4CIDRLimits(rawValue, cidrMask);
        cidrLimits.v6 = false;
      }
      instance.cidrs.push(cidrLimits);
      instance.rawtoPreparedMap.push({
        cidr: true,
        index: cidrIndex
      });
    } else {
      instance.prepared.push(rawValue);
      instance.rawtoPreparedMap.push({
        cidr: false,
        index: beginIndex
      });
    }
  };

  // Function to remove an IP or CIDR block from the block list
  instance.remove = (ip) => {
    const index = instance.raw.indexOf(ip);
    if (index == -1) return false;
    const map = instance.rawtoPreparedMap[index];
    instance.raw.splice(index, 1);
    instance.rawtoPreparedMap.splice(index, 1);
    if (map.cidr) {
      instance.cidrs.splice(map.index, 1);
    } else {
      instance.prepared.splice(map.index, 1);
    }
    return true;
  };

  // Function to check if an IP is blocked by the block list
  instance.check = (rawValue) => {
    if (instance.raw.length == 0) return false;
    let isIPv6 = false;

    // Normalize or expand the IP address
    rawValue = rawValue.toLowerCase();
    if (rawValue == "localhost") rawValue = "::1";
    if (rawValue.indexOf("::ffff:") == 0) rawValue = rawValue.substring(7);
    if (rawValue.indexOf(":") > -1) {
      isIPv6 = true;
      rawValue = expandIPv6Address(rawValue);
    } else {
      rawValue = normalizeIPv4Address(rawValue);
    }

    // Check if the IP is in the prepared list
    if (instance.prepared.indexOf(rawValue) > -1) return true;

    // Check if the IP is within any CIDR block in the block list
    if (instance.cidrs.length == 0) return false;
    const ipParsedObject = (!isIPv6 ? ipv4ToInt : ipv6ToBlocks)(rawValue);
    const checkMethod = !isIPv6
      ? checkIfIPv4CIDRMatches
      : checkIfIPv6CIDRMatches;

    return instance.cidrs.some((iCidr) => checkMethod(ipParsedObject, iCidr));
  };

  // Add initial raw block list values to the instance
  rawBlockList.forEach((rbe) => {
    instance.add(rbe);
  });

  return instance;
}

module.exports = ipBlockList;
