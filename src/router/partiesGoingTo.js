import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';

import { fetchPartiesGoingTo, guestList, guestListPending } from '../database';

export const partiesGoingTo = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const id = user.id;
  const parties = await fetchPartiesGoingTo(id);
  const partiesFormatted = await parties.map(async party => {
    const awaitedParty = await party;
    const hostId = awaitedParty.host_id;
    const partyID = awaitedParty.id;
    const list = await guestList(partyID, id);
    const listPending = await guestListPending(partyID, id);
    const host = await userByID(hostId);
    return {
      ...awaitedParty,
      guests: list ? list.length : 0,
      pending_guests: listPending ? listPending.length : 0,
      host: host
    };
  });
  if(!parties) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора событий, попробуйте позже'
  });

  console.log(partiesFormatted.length);

  const filteredParties = partiesFormatted.filter(party => (party.end_time || Number.MAX_SAFE_INTEGER) > Date.now()); // this filter should be changed to SQL Request in /database
  Promise.all(filteredParties).then(result => {
    res.json({
      data: result.reverse(),
      error: null
    });
  });
};
