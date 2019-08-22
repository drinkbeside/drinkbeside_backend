import { fetchPlaces } from '../middleware/places';

export const places = async (req, res) => {
  await fetchPlaces(res, req.body.city);
};
