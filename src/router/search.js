import fusejs from 'fuse.js';
import { fetchPlaces } from '../middleware/places';

export const search = async (req, res) => {
  const query = req.body.query;
  const city = req.body.city;
  if (!query || !city) return res.json({
    data: null,
    error: 'Некорректный запрос'
  });
  const options = {
    keys: [{
      name: 'title',
      weight: 0.5
    }, {
      name: 'address',
      weight: 0.2
    }, {
      name: 'subway',
      weight: 0.3
    }]
  };
  const data = await fetchPlaces(null, city);
  if (!data) return res.status(500).json({
    data: null,
    error: 'Ошибка на стороне сервера, попробуйте позже'
  });
  const fuse = new fusejs(JSON.parse(data), options);
  const result = await fuse.search(query);
  res.json({
    data: result,
    error: null
  });
};
