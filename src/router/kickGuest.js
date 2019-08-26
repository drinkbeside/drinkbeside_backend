import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { kickGuest as removeGuest } from '../database';

export const kickGuest = async (req, res) => {
  const partyID = req.body.partyID;
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const guestID = req.body.guestID;
  const done = await removeGuest(partyID, userID, guestID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка исключения пользователя'
  });
  res.json({
    data: done,
    error: null
  });
};
