import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { updateRating } from '../database';

export const rate = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const guestID = req.body.guest_id;
  const rating = Number.parseInt(req.body.rating);
  if(!guestID || !rating) return res.status(400).json({
    data: null,
    error: 'Переданы не все необходимые параметры'
  });
  const updatedUser = await updateRating(guestID, userID, rating);
  if(!updatedUser) return res.status(500).json({
    data: null,
    error: 'Невозможно поставить оценку пользователю'
  });
  res.json({
    data: `Рейтинг пользователя ${updatedUser.fname} ${updatedUser.lname} обновлен`,
    error: null
  });
};
