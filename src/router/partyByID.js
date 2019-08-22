import { partyByID as getParty } from '../database';

export const partyByID = async (req, res) => {
  const id = req.params.id;
  const party = await getParty(id);
  if (!party) return res.status(404).json({
    data: null,
    error: 'Данного события не существует'
  });
  res.json({
    data: party,
    error: null
  });
};
