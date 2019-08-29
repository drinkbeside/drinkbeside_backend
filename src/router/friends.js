import { friendsByID } from '../database';

export const friends = async (req, res) => {
  const id = req.params.id;
  const friends = await friendsByID(id);
  if(!friends) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора друзей, попробуйте позже'
  });
  res.json({
    data: friends,
    error: null
  });
};
