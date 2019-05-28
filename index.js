const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const asyncRedis = require("async-redis");
const axios = require('axios');
const fs = require('fs');
const app = express();
const redis = asyncRedis.createClient();
const multer = require('multer');
const upload = multer();
// to keep consts away from file
require('dotenv').config();

const defURL = process.env.DEF_URL;

const { Client } = require('pg');

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
app.use(express.static('public')); // nu a vdrug

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
    const client = new Client(process.env.DB_URL);
    await client.connect();
    let user = await client.query(`SELECT * FROM users WHERE phone = '${phone.replace('+','')}'`);
    if (!user.rowCount) {
      user = await client.query(`INSERT INTO users (phone) VALUES (${phone}) RETURNING *`);
    };
    await redis.del(phone);
    return res.json({
      error: null,
      data: user.rows[0]
    });
  }
  res.json({
    error: 'Wrong code sent to server',
    data: null
  });
});

app.get('/user/:id', async (req, res) => {
  const id = req.params.id;
  const client = new Client(process.env.DB_URL);
  await client.connect();
  const user = await client.query(`SELECT * FROM users WHERE id = ${Number.parseInt(id)}`);
  res.json({
    error: null,
    data: user.rows[0]
  });
});

app.get('/places', async (req, res) => {
  await fetchPlaces(res);
});

app.post('/update_user_info', async (req, res) => {
  const data = req.body;
  const id = data.id;
  const client = new Client(process.env.DB_URL);
  await client.connect();
  const user = await client.query(`SELECT * FROM users WHERE id = ${Number.parseInt(id)}`);
  if (user.rowCount) {
    let update_query_array = [];
    for (let key in data.fields) {
      if (!(key=='id') && !(key=='avatar')) {
      update_query_array.push(`${key} = '${data.fields[key]}'`);
      }
    }
    const updated_users = await client.query(`UPDATE users SET ${update_query_array.join(',')} WHERE id = ${Number.parseInt(id)} RETURNING *;`);
    return res.json({
    error: null,
    data: updated_users.rows[0]
  });
  }
  res.json({
    error: 'Ошибка обновления данных пользователя',
    data: null
  })
});

app.post('/update_avatar', upload.single('image'), async (req, res, next) => {
  const id = req.body.id;
  const image = req.file.buffer;
  const imagepath = `images/avatars/id_${id}.png`;
  fs.writeFile('public/'+imagepath, image, (err) => {
    if (err) throw err;
  });
  const client = new Client(process.env.DB_URL);
  await client.connect();
  const updated_users = await client.query(`UPDATE users SET avatar = '${imagepath}' WHERE id = ${Number.parseInt(id)} RETURNING *;`);
  res.json({
    error: null,
    data: updated_users.rows[0]
  })
});

// moving to dev branch
app.listen(process.env.PORT, () => {
  console.log(`UP & RUNNING ON ${process.env.PORT}`);
});
