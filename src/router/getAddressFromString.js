import { addressToLatlon } from '../middleware/geocoder';

export const getAddressFromString = async (req, res) => {
  const result = await addressToLatlon(res.body.input);
  if(!result) return res.json({
    error: `can't parse address from string`,
    data: null
  });
  res.json({
    error: null,
    data: result
  });
};
