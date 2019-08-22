import { userByID, updateUserInfo as editUser } from '../database';

export const updateUserInfo = async (req, res) => {
  const data = req.body;
  const id = Number.parseInt(data.id);
  const user = await userByID(id);
  if (user) {
    const updateQueryArray = Object.keys(data.fields)
      .filter(key => key !== 'id' && key !== 'avatar')
      .map(key => `${key} = '${data.fields[key]}'`)
      .join(',');
    const updatedUser = await editUser(id, updateQueryArray);
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
