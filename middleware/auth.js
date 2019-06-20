require('dotenv').config();
const jwt = require('jsonwebtoken');
const asyncRedis = require('async-redis');
const redis = asyncRedis.createClient();

module.exports.authorize = async (req, res, next) => {
  const id = req.headers.id;
  const token = req.headers.token;
  const savedToken = await redis.get(id);
  const correctToken = token === savedToken;
  const verifiedToken = jwt.verify(token, process.env.SECRET);
  if(!correctToken || !verifiedToken) return res.json({
    error: 'Ошибка доступа по токену, вы должны быть авторизованы',
    data: null
  });
  next();
};
