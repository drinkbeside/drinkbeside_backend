const openGeocoder = require('node-open-geocoder');

export const latlonToAddress = async (lat, lon) => {
  return await openGeocoder()
    .reverse(lat, lon)
    .end((err, res) => {
      if(err) return null;
      return res;
    });
};

export const addressToLatlon = async (input) => {
  return await openGeocoder()
    .geocode(encodeURI(input))
    .end((err, res) => {
      if(err) return null;
      return res;
    });
};
