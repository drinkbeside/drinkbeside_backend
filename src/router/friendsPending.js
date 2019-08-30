import { pendingFriendsByID } from '../database';

export const friendsPending = async (req, res) => {
  const id = req.params.id;
  const friends = await pendingFriendsByID(id);
  console.log(friends);
  if(!friends) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора заявок в друзья, попробуйте позже'
  });
  res.json({
    data: friends,
    error: null
  });
};
