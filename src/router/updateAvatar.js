import fs from 'fs';
import jwt from 'jsonwebtoken';

import { updateAvatar as editAvatar } from '../database';

export const updateAvatar = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const id = user.id;
  const image = req.file.buffer;
  const path = `images/avatars/id_${id}.png`;
  try {
    fs.writeFileSync(`public/${path}`, image);
  } catch (e) {
    return res.status(500).json({
      error: 'Ошибка сохранения аватара, попробуйте заново',
      data: null
    });
  }
  const updatedUser = await editAvatar(id, path);
  if (updatedUser) return res.json({
    error: null,
    data: updatedUser
  });
  res.status(500).json({
    error: 'Ошибка загрузки, попробуйте заново',
    data: null
  });
}
