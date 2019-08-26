import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import asyncRedis from 'async-redis';
const redis = asyncRedis.createClient();

import { userByPhone, saveUser } from '../database';

export const confirmCode = async (req, res) => {
  const phone = req.body.phoneNumber.replace('+', '');
  const code = req.body.code;
  const city = req.body.city;
  const codeKept = await redis.get(phone);
  if (!codeKept || codeKept !== code) return res.status(400).json({
    error: 'Вы прислали неверный код',
    data: null
  });
  let user = await userByPhone(phone);
  if (!user) user = await saveUser(phone);
  if(city) await updateUserLocation(user.id, city);
  if (user) {
    await redis.del(phone);
    const access = jwt.sign({ user }, config.SECRET, { expiresIn: '1w' });
    const refresh = jwt.sign({ access }, config.SECRET, { expiresIn: '1w' });
    await redis.set(access, JSON.stringify(user));
    await redis.set(refresh, access);
    return res.json({
      error: null,
      data: { ...user, access, refresh }
    });
  }
  res.status(500).json({
    error: 'Невозможно авторизовать пользователя',
    data: null
  });
};
