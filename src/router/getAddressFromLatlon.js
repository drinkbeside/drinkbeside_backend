import { latlonToAddress } from '../middleware/geocoder';

export const getAddressFromLatlon = async (req, res) => {
  const result = await latlonToAddress(res.body.lat, res.body.lon);
  if(!result) return res.json({
    error: `can't parse address from latlon`,
    data: null
  });
  res.json({
    error: null,
    data: result
  });
};
