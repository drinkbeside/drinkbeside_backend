const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const asyncRedis = require("async-redis");
const axios = require('axios');

const app = express();
const redis = asyncRedis.createClient();

const defURL = 'https://smsc.ru/sys/send.php?login=Hadevs&psw=0a9s8d7f&phones=<phones>&mes=<message>';

const fetchPlaces = async (res, places = [], city = 'spb', page = 1) => {
  const url = `https://kudago.com/public-api/v1.4/places/?lang=${'ru'}&page=${page}&page_size=100&fields=${'title,address,location,timetable,phone,description,coords,subway'}&text_format=text&location=${city}&categories=bar,bar-s-zhivoj-muzykoj,cafe,clubs,fastfood,restaurants`;
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

app.use(cors());

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.post('/send_code', async (req, res) => {
  const phone = req.body.phoneNumber;
  const random = Math.floor(100000 + Math.random() * 900000);
  await redis.set(phone, random);
  setTimeout(() => {
    redis.del(phone);
  }, 1000 * 60 * 3);
  const toSend = defURL.replace('<phones>', phone).replace('<message>', random);
  try {
    const response = await axios.get(toSend);
    res.json({
      error: null,
      data: 'Code sent'
    });
  } catch(e) {
    res.json({
      error: 'Error sending code',
      data: null
    });
  }
});

app.post('/confirm_code', async (req, res) => {
  const phone = req.body.phoneNumber;
  const code = req.body.code;
  const codeKept = await redis.get(phone);
  if(codeKept && codeKept === code) {
    await redis.del(phone);
    return res.json({
      error: null,
      data: 'OK'
    });
  }
  res.json({
    error: 'Wrong code sent to server',
    data: null
  });
});

app.get('/places', async (req, res) => {
  await fetchPlaces(res);
});

app.listen(8080, () => {
  console.log('UP & RUNNING');
});
