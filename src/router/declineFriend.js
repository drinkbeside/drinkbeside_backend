import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { declineFriend as cancelFriend } from '../database';

export const declineFriend = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const uid = user.id;
  const id = req.params.id;
  const cancelled = await cancelFriend(uid, id);
  if(!cancelled) return res.status(500).json({
    data: null,
    error: 'Ошибка удаления заявки в друзья, попробуйте позже'
  });
  res.json({
    data: true,
    error: null
  });
};
