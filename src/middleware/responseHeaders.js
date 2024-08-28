module.exports = (req, res, logFacilities, config, next) => {
  if (!req.isProxy) {
    var hkh = config.getCustomHeaders();
    Object.keys(hkh).forEach((hkS) => {
      try {
        res.setHeader(hkS, hkh[hkS]);
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        // Headers will not be set.
      }
    });
  }

  next();
};

module.exports.proxySafe = true;
