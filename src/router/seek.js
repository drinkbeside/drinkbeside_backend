import { userByInput } from '../database';

export const seek = async (req, res) => {
  const query = req.query.input;
  const user = await userByInput(query);
  if(!user) return res.status(404).json({
    error: `Невозможно найти пользователя по ${query}`,
    data: null
  });
  res.json({
    error: null,
    data: {
      ...user
    }
  });
};
