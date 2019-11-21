import * as dotenv from 'dotenv';
dotenv.config();
import FCM from 'fcm-node';
const fcm = new FCM(process.env.FCM_TOKEN);
import asyncRedis from 'async-redis';
const redis = asyncRedis.createClient();

import { userByID } from '../database';

export const sendFcmMessage = async (req, res) => {
  const title = req.body.title;
  const body = req.body.body;
  const userId = Number.parseInt(req.body.userId);
  const user = await userByID(userId);
  const token = user.fcmtoken;
  if (!token) return res.json({
    error: "Пользователь не зарегистрировал токен для уведомлений.",
    data: null
  });
  /* this may vary according to the message
  type (single recipient, multicast, topic, et cetera) */
  const message = {
    to: token,
    notification: {
      title: title,
      body: body
    }
  };
  fcm.send(message, (err, response) => {
    if (err) return res.json({
      error: err,
      data: null
    });
    return res.json({
      error: null,
      data: response
    });
  });
};
