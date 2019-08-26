import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { leaveParty as offParty } from '../database';

export const leaveParty = async (req, res) => {
  const partyID = req.body.partyID;
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = Number.parseInt(user.id);
  const done = await offParty(partyID, userID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка исключения пользователя'
  });
  res.json({
    data: done,
    error: null
  });
};
