import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { joinParty as joinToParty } from '../database';

export const joinParty = async (req, res) => {
  const partyID = req.body.partyID;
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = Number.parseInt(user.id);
  done = await joinToParty(partyID, userID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка присоединения'
  });
  res.json({
    data: done,
    error: null
  });
};
