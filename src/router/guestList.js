import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { fetchGuests, fetchGuestsPending } from '../database';

export const guestList = async (req,res) => {
  const partyID = req.params.pid;
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const list = await fetchGuests(partyID, userID);
  const listPending = await fetchGuestsPending(partyID, userID);
  if (!list) return res.status(403).json({
    data: null,
    error: 'Ошибка получения списка участников'
  });
  res.json({
    data: {
      going: list,
      pending: listPending
    },
    error: null
  });
};
