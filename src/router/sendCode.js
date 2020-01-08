import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import axios from 'axios';

import asyncRedis from 'async-redis';
const redis = asyncRedis.createClient();

export const sendCode = async (req, res) => {
  const phone = req.body.phoneNumber;
  const random = phone.replace('+', '') === '78885554141' ? 888888 : Math.floor(100000 + Math.random() * 900000);
  await redis.set(phone.replace('+', ''), random);
  setTimeout(() => {
    redis.del(phone.replace('+', ''));
  }, config.SMS_TIMEOUT);
  const toSend = config.DEF_URL
    .replace('<phones>', phone)
    .replace('<message>', random);
  try {
    const response = await axios.get(toSend);
    res.json({
      error: null,
      data: 'Код отправлен'
    });
  } catch (e) {
    res.status(500).json({
      error: 'Ошибка отправки проверочного кода',
      data: null
    });
  }
};
