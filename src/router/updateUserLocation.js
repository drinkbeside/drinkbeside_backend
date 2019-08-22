import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { updateLocation } from '../database';

export const updateUserLocation = async (req, res) => {
  const user = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const city = req.body.city;
  const done = await updateLocation(userID, city);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка изменения города пользователя'
  });
  res.json({
    data: done,
    error: null
  });
};
