import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';

import { partyByID as getParty } from '../database';

export const partyByID = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const uid = user.id;
  const pid = req.params.id;
  const party = await getParty(pid, uid);
  if (!party) return res.status(404).json({
    data: null,
    error: 'Данного события не существует'
  });
  res.json({
    data: party,
    error: null
  });
};
