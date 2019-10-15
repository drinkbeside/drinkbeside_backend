import asyncRedis from 'async-redis';

import { fetchPlaces } from '../middleware/places';
import { userByPhone } from '../database/users';

const redis = asyncRedis.createClient();

export const places = async (req, res) => {
  let city = req.body.city;
  if (!city) {
    const user = await redis.get(req.headers.access);
    const parsed = JSON.parse(user);
    const found = await userByPhone(parsed.phone);
    city = found.city;
  }
  await fetchPlaces(res, city);
};
