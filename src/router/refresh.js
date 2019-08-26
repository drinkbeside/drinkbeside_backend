import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import asyncRedis from 'async-redis';
const redis = asyncRedis.createClient();

export const refresh = async (req, res) => {
  const refresher = req.headers.refresh;
  return await jwt.verify(refresher, config.SECRET, async (err, decoded) => {
    if(err || decoded.expired) return res.status(401).json({
      error: 'Время жизни токена исчерпано',
      data: null
    });
    const token = await redis.get(refresher);
    if(!token) return res.status(403).json({
      error: 'Неверный токен',
      data: null
    });
    return await jwt.verify(token, config.SECRET, async (err, decoded) => {
      await redis.del(refresher);
      await redis.del(token);
      const user = decoded;
      const access = jwt.sign({ user }, config.SECRET, { expiresIn: '1w' });
      const refresh = jwt.sign({ access }, config.SECRET, { expiresIn: '1w' });
      await redis.set(access, JSON.stringify(user));
      await redis.set(refresh, access);
      return res.json({
        error: null,
        data: { ...user, access, refresh }
      });
    });
  });
}
