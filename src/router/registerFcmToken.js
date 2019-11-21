import { updateUserFcmToken } from '../database';
import { userByID } from '../database/users.js'

export const registerFcmToken = async (req, res) => {
  const { userId, token } = req.body;
  const id = Number.parseInt(userId);
  const user = await userByID(id);
  if (!user) return res.status(500).json({
    error: 'Ошибка, такого пользователя не существует',
    data: null
  });
  const updatedUser = await updateUserFcmToken(id, token);
  if (!updatedUser) return res.status(500).json({
    error: 'Ошибка обновления данных пользователя',
    data: null
  });
  return res.json({
    error: null,
    data: updatedUser
  });
};
