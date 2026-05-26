const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = decoded; // { id, rol, iat, exp }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, error: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'No autorizado, no hay token' });
  }
};

module.exports = { protect };
