require('dotenv').config();
const jwt = require('jsonwebtoken');
const asyncRedis = require('async-redis');
const redis = asyncRedis.createClient();

module.exports.authorize = async (req, res, next) => {
  const token = req.headers.access;
  return await jwt.verify(token, process.env.SECRET, async (err, decoded) => {
    if(err) return res.status(403).json({
      error: 'Ошибка доступа по токену, токен истек',
      data: null
    });
    const user = await redis.get(token);
    if(decoded.phone !== user.phone || decoded.expired) return res.status(401).json({
      error: 'Ошибка доступа по токену, вы должны быть авторизованы',
      data: null
    });
    return next();
  });
};
