import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({
      message: "Token requerido"
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, "secreto_jwt", (err, decoded) => {

    if (err) {
      return res.status(401).json({
        message: "Token inválido"
      });
    }

    req.user = decoded;

    next();
  });

};

export default verifyToken;