const axios = require('axios');

exports.fetchPlaces = async (res, places = [], city = 'spb', page = 1, lang = 'ru') => {
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
    return res.json({
      error: null,
      data: updatedPlaces
    });
  }
  await fetchPlaces(res, updatedPlaces, city, ++page);
};
