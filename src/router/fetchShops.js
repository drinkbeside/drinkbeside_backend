import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;
import {decode, encodeEnglish} from '../middleware/citydecoder';
import jwt from 'jsonwebtoken';
var GooglePlaces = require("googleplaces");
var googlePlaces = new GooglePlaces("AIzaSyD_HUegxAl7wfn5nQtHtDDh0gut-1nBtDM", 'json'); // todo: // pls move this key to external safe place, i dunno where it is

export const fetchShops = async (req, res) => {
  const { user } = await jwt.verify(req.headers.access, config.SECRET);
  const citykey = decode(user.city);
  const translatedCity = encodeEnglish(citykey);
  
  var parameters;
  parameters = {
      query: `grocery in ${translatedCity} russia`
  };
  googlePlaces.textSearch(parameters, function (error, response) {
      if (error) throw error;
      res.send(response.results);
  });
};
