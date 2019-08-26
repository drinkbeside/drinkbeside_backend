import * as dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import asyncRedis from 'async-redis';
const redis = asyncRedis.createClient();

export const authorize = async (req, res, next) => {
  const token = req.headers.access;
  return await jwt.verify(token, process.env.SECRET, async (err, decoded) => {
    if(err) {
      console.log(err);
      return res.status(403).json({
        error: 'Ошибка доступа по токену, токен истек',
        data: null
      });
    }
    const user = await redis.get(token);
    if(!user) return res.status(401).json({
      error: 'Ошибка, такого токена не существует',
      data: null
    });
    const parsed = JSON.parse(user);
    console.log(decoded);
    if(decoded.user.phone !== parsed.phone || decoded.expired) return res.status(401).json({
      error: 'Ошибка доступа по токену, вы должны быть авторизованы',
      data: null
    });
    return next();
  });
};
