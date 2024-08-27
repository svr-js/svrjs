module.exports = (req, res, logFacilities, config, next) => {
  if (!req.isProxy) {
    var hkh = config.getCustomHeaders();
    Object.keys(hkh).forEach((hkS) => {
      try {
        res.setHeader(hkS, hkh[hkS]);
      } catch (err) {
        // Headers will not be set.
      }
    });
  }

  next();
};

module.exports.proxySafe = true;
