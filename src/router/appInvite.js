import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;
import jwt from 'jsonwebtoken';

import axios from 'axios';

export const appInvite = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const phone = req.body.phoneNumber;
  const invitation = config.INVITATION_MESSAGE_TEMPLATE
    .replace('<invitation_text>', config.INVITATION_MESSAGE_TEXT_RU)
    .replace('<user_fullname>', `${user.fname} ${user.lanme ? user.lname + ' ' : ''}`);
  const toSend = config.DEF_URL
    .replace('<phones>', phone)
    .replace('<message>', invitation);
  try {
    const response = await axios.get(toSend);
    res.json({
      error: null,
      data: 'Приглашение отправлено'
    });
  } catch (e) {
    res.status(500).json({
      error: 'Ошибка отправки приглашения',
      data: null
    });
  }
};
