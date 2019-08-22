import { userByID } from '../database';

export const seekUserByID = async (req, res) => {
  const id = Number.parseInt(req.params.id);
  const user = await userByID(id);
  if (!user) return res.status(404).json({
    error: `Невозможно найти пользователя с ID ${id}`,
    data: null
  });
  res.json({
    error: null,
    data: {
      ...user
    }
  });
};
