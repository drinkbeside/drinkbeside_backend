import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import jwt from 'jsonwebtoken';
import { inviteToParty as addToParty } from '../database';

export const inviteToParty = async (req, res) => {
  const partyID = req.body.party_id;
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const userID = user.id;
  const guestID = req.body.guest_id;
  const { done, party, updatedUser } = await addToParty(partyID, userID, guestID);
  console.log(updatedUser);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка на стороне сервера, либо вы не хост события'
  });
  res.json({
    data: `Вы пригласили ${updatedUser.fname} ${updatedUser.lname} на ${party.name}`,
    error: null
  });
};
