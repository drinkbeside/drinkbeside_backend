import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { createParty as newParty, joinParty } from '../database';

export const createParty = async (req, res) => {
  const user = await jwt.verify(req.headers.access, config.SECRET);
  const uid = user.id;
  const hostID = req.body.hostID;
  const invitedIDs = req.body.invitedIDs || [];
  const name = req.body.name;
  const minPrice = req.body.minPrice || 0;
  const maxPrice = req.body.maxPrice || 0;
  const address = req.body.address;
  const type = req.body.type || 0;
  const start = req.body.start;
  const end = req.body.end || 0;
  const minRating = req.body.minRating || 0.0;
  const limit = req.body.limit || 0;
  if (!hostID || !name || !address || !start) return res.json({
    data: null,
    error: 'Указаны не все обязательные поля'
  });
  const party = await newParty({
    hostID, invitedIDs, name,
    minPrice, maxPrice, address, type,
    start, end, minRating, limit
  });
  if(!party) return res.status(500).json({
    data: null,
    error: 'Невозможно создать событие'
  });
  done = await joinParty(party.id, uid);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка создания тусовки'
  });
  res.json({
    data: party,
    error: null
  });
};
