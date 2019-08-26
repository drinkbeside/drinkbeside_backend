import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { suspendParty as cancelParty } from '../database';

export const suspendParty = async (req, res) => {
  const partyID = req.body.party_id;
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const done = await cancelParty(partyID, userID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка приостановки события.'
  });
  res.json({
    data: done,
    error: null
  });
};
