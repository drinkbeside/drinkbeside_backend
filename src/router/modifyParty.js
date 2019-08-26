import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { modifyParty as editParty } from '../database';

export const modifyParty = async (req, res) => {
  const partyID = req.body.partyID;
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const fields = req.body.fields;
  const updateQueryArray = Object.keys(fields)
    .filter(key => !(key in ['id', 'host_id', 'is_suspended']))
    .map(key => `${key} = '${fields[key]}'`)
    .join(',');
  const done = await editParty(partyID, userID, updateQueryArray);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка изменения параметров события'
  });
  res.json({
    data: done,
    error: null
  });
};
