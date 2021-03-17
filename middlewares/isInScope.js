exports.isInScope = (requiredScope) => (req, res, next) => {
  if (req.tokenPayload.roleId.name === "Admin") {
    next();
    return;
  }
  const scopesAvailableToUser = req.tokenPayload.roleId.scopes;
  let inScope = false;
  scopesAvailableToUser.forEach((scope) => {
    if (scope === requiredScope) {
      inScope = true;
    }
  });
  if (inScope) {
    next();
  } else {
    res.send({ status: false, message: "this route is out of users scope" });
  }
};
