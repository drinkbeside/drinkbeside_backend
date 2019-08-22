const cities = [
  {
    key: 'spb',
    names: ['Санкт-Петербург', 'Saint-Petersburg']
  },
  {
    key: 'msk',
    names: ['Москва', 'Moscow']
  }
];

export const decode = (city) => {
  const position = cities.filter(step => step.names.includes(city));
  if(!position) return null;
  return position[0].key;
};
