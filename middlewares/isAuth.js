const jwt = require("jsonwebtoken");

const secret = require("../config/keys.json").jwtSecret;

exports.isAuth = (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    res.status(401).send({ status: false, message: "token is not available" });
  } else {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        res.status(401).send({ status: false, message: "User not authorized" });
      } else {
        console.log(decoded);
        req.tokenPayload = decoded;
        next();
      }
    });
  }
};
