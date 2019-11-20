import { updateUserFcmToken } from '../database';
import { userByID } from '../database/users.js'

export const registerFcmToken = async (req, res) => {
  const data = req.body;
  const token = data.token;
  const id = Number.parseInt(data.userId);
  const user = await userByID(id);
  console.log(id, user);
  if (user) {
    const updatedUser = await updateUserFcmToken(id, token);
    if (updatedUser) return res.json({
      error: null,
      data: updatedUser
    });
  }
  res.status(500).json({
    error: 'Ошибка обновления данных пользователя',
    data: null
  });
};
