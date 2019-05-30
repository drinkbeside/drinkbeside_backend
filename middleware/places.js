const axios = require('axios');
const asyncRedis = require("async-redis");
const redis = asyncRedis.createClient();

const fetchPlaces = async (res, places = [], city = 'spb', page = 1, lang = 'ru') => {
  // checking cache
  let cachedPlaces = await redis.get('spb');
  if(cachedPlaces) return res.json({
    error: null,
    data: JSON.parse(cachedPlaces)
  });
  // in case there is no cache
  const url = `https://kudago.com/public-api/v1.4/places/?lang=${lang}&page=${page}&page_size=100&fields=${'title,address,location,timetable,phone,description,coords,subway'}&text_format=text&location=${city}&categories=bar,bar-s-zhivoj-muzykoj,cafe,clubs,fastfood,restaurants`;
  let updatedPlaces = [];
  let response;
  try {
    response = await axios.get(url);
    updatedPlaces = places.concat(response.data.results);
  } catch(e) {
    response = null;
  }
  if(!response.data.next) {
    redis.set('spb', JSON.stringify(updatedPlaces));
    setTimeout(() => {
      redis.del('spb');
    }, process.env.CACHE_TIMEOUT);
    return res.json({
      error: null,
      data: updatedPlaces
    });
  }
  await fetchPlaces(res, updatedPlaces, city, ++page);
};

module.exports.fetchPlaces = fetchPlaces;
