// import fusejs from 'fuse.js';

import asyncRedis from 'async-redis';

import { fetchPlaces } from '../middleware/places';
import { userByPhone } from '../database/users';

const redis = asyncRedis.createClient();

export const search = async (req, res) => {
  const query = req.body.query;
  let city = req.body.city;
  
  if (!query) return res.json({
    data: null,
    error: 'Некорректный запрос, введите параметр query'
  });
  if (!city) {
    const user = await redis.get(req.headers.access);
    const parsed = JSON.parse(user);
    const found = await userByPhone(parsed.phone);
    city = found.city;
  }
  // const options = {
  //   keys: [{
  //     name: 'title',
  //     weight: 0.5
  //   }, {
  //     name: 'address',
  //     weight: 0.2
  //   }, {
  //     name: 'subway',
  //     weight: 0.3
  //   }]
  // };
  const places = await fetchPlaces(null, city);
  const data = places.filter(it => (it.name || "").toLowerCase().includes(query.toLowerCase()) || (it.address || "").toLowerCase().includes(query.toLowerCase()))
  // i know sql request will be better, but this request was not working at all, idite nahuy
  //todo: /\
  //      ||
  //      ||
  if (!data) return res.status(500).json({
    data: null,
    error: 'Ошибка на стороне сервера, попробуйте позже'
  });
  // const fuse = new fusejs(JSON.parse(data), options);
  // const result = await fuse.search(query);
  res.json({
    data: data,
    error: null
  });
};
