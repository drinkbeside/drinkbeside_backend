const cities = [
  {
    key: 'spb',
    names: ['Санкт-Петербург', 'Saint-Petersburg']
  },
  {
    key: 'msk',
    names: ['Москва', 'Moscow']
  },
  {
    key: 'krd',
    names: ['Краснодарcкий край', 'Krasnodar']
  }
];

export const decode = (city) => {
  const position = cities.filter(step => step.names.includes(city));
  if(!position) return null;
  return position[0].key;
};

export const encode = (key) => {
  return cities.filter(city => city.key === key)[0].names[0];
}

export const encodeEnglish = (key) => {
  return cities.filter(city => city.key === key)[0].names[1];
}
