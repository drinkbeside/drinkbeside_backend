import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { removeFriend as deleteFriend } from '../database';

export const removeFriend = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const uid = user.id;
  const id = req.params.id;
  const added = await deleteFriend(uid, id);
  if(!added) return res.status(500).json({
    data: null,
    error: 'Ошибка удаления из друзей, попробуйте позже'
  });
  res.json({
    data: true,
    error: null
  });
};
