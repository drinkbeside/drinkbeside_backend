import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';

import { fetchParties, guestList, guestListPending, userByID } from '../database';

export const parties = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const id = user.id;
  const startTime = req.query.start_time || null;
  const endTime = req.query.end_time || null;
  const guestMinAmount = req.query.min_amount || null;
  const guestMaxAmount = req.query.max_amount || null;
  const limit = req.query.limit || null;
  const parties = await fetchParties(
    id,
    startTime,
    endTime,
    guestMinAmount,
    guestMaxAmount,
    limit
  );
  if(!parties || !parties[0]) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора событий, попробуйте позже'
  });
  const partiesFormatted = await parties.map(async party => {
    const awaitedParty = await party;
    const hostId = awaitedParty.host_id;
    const partyID = awaitedParty.id;
    const list = await guestList(partyID, id);
    const listPending = await guestListPending(partyID, id);
    console.log(awaitedParty);
    const host = await userByID(hostId);
    console.log(host);
    return {
      ...awaitedParty,
      guests: list ? list.length : 0,
      pending_guests: listPending ? listPending.length : 0,
      host: host
    };
  });

  const filteredParties = partiesFormatted.filter(party => (party.end_time || Number.MAX_SAFE_INTEGER) > Date.now()); // this filter should be changed to SQL Request in /database
  Promise.all(filteredParties).then(result => {
    res.json({
      data: result.reverse(),
      error: null
    });
  });
};
