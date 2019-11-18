import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';

import { fetchParties, guestList, guestListPending } from '../database';

export const parties = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const id = user.id;
  const startTime = req.params.start_time || null;
  const endTime = req.params.end_time || null;
  const guestMinAmount = req.params.min_amount || null;
  const guestMaxAmount = req.params.max_amount || null;
  const parties = await fetchParties(
    id,
    startTime,
    endTime,
    guestMinAmount,
    guestMaxAmount
  );
  const partiesFormatted = await parties.map(async party => {
    const awaitedParty = await party;
    const partyID = awaitedParty.id;
    const list = await guestList(partyID, id);
    const listPending = await guestListPending(partyID, id);
    return {
      ...awaitedParty,
      guests: list ? list.length : 0,
      pending_guests: listPending ? listPending.length : 0
    };
  });
  if(!parties) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора событий, попробуйте позже'
  });
  Promise.all(partiesFormatted).then(result => {
    res.json({
      data: result.reverse(),
      error: null
    });
  });
};
