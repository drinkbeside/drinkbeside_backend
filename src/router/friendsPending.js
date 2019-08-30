import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;
import jwt from 'jsonwebtoken';

import { pendingFriendsByID } from '../database';

export const friendsPending = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const friends = await pendingFriendsByID(user.id);
  if(!friends) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора заявок в друзья, попробуйте позже'
  });
  res.json({
    data: friends,
    error: null
  });
};
