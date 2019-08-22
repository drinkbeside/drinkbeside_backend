import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import axios from 'axios';

export const appInvite = async (req, res) => {
  const phone = req.body.phoneNumber;
  const invitation = config.INVITATION_MESSAGE_TEMPLATE
    .replace('<invitation_text>', config.INVITATION_MESSAGE_TEXT_RU);
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
