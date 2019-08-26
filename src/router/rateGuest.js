import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { fetchGuests } from '../database';

export const rateGuest = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const partyID = req.params.id;
  if(!userID || !partyID) return res.json({
    data: null,
    error: 'Переданы не все необходимые параметры'
  });
  const guests = await fetchGuests(userID, partyID);
  if(!guests) return res.status(403).json({
    data: null,
    error: 'Скорее всего Вы не являетесь хостом события, либо события не существует'
  });
  res.json({
    data: guests,
    error: null
  });
};
