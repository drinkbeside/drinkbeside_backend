// to keep consts away from file
require('dotenv').config();
// libraries
const fusejs = require('fuse.js')
const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const asyncRedis = require("async-redis");
const axios = require('axios');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
// system consts
const app = express();
const redis = asyncRedis.createClient();
const upload = multer();
// custom functions
const {
  userByID,
  userByPhone,
  saveUser,
  updateUserInfo,
  updateAvatar
} = require('./database/postgres');
const { fetchPlaces } = require('./middleware/places');
const { authorize } = require('./middleware/auth');
// express application configuration
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/send_code', async (req, res) => {
  const phone = req.body.phoneNumber;
  const random = Math.floor(100000 + Math.random() * 900000);
  await redis.set(phone.replace('+',''), random);
  setTimeout(() => {
    redis.del(phone.replace('+',''));
  }, process.env.SMS_TIMEOUT);
  const toSend = process.env.DEF_URL
    .replace('<phones>', phone)
    .replace('<message>', random);
  try {
    const response = await axios.get(toSend);
    res.json({
      error: null,
      data: 'Code sent'
    });
  } catch(e) {
    res.json({
      error: 'Ошибка отправки проверочного кода',
      data: null
    });
  }
});

app.post('/confirm_code', async (req, res) => {
  const phone = req.body.phoneNumber.replace('+','');
  const code = req.body.code;
  const codeKept = await redis.get(phone);
  if(codeKept && codeKept === code) {
    let user = await userByPhone(phone);
    if(!user) {
      user = await saveUser(phone);
    };
    if(user) {
      await redis.del(phone);
      const token = jwt.sign({ user }, process.env.SECRET);
      await redis.set(user.id, token);
      return res.json({
        error: null,
        data: {
          ...user,
          token: token
        }
      });
    }
  }
  res.json({
    error: 'Вы прислали неверный код',
    data: null
  });
});

app.get('/user/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id);
  const user = await userByID(id);
  if(!user) return res.json({
    error: `Невозможно найти пользователя с ID ${id}`,
    data: null
  });
  res.json({
    error: null,
    data: {
      ...user,
      token: await redis.get(user.id)
    }
  });
});

app.post('/places', authorize, async (req, res) => {
  await fetchPlaces(res, req.body.city);
});

app.post('/update_user_info', authorize, async (req, res) => {
  const data = req.body;
  const id = Number.parseInt(data.id);
  const user = await userByID(id);
  if(user) {
    const updateQueryArray = data.fields
      .filter(key => key !== 'id' && key !== 'avatar')
      .map(key => `${key} = '${data.fields[key]}'`)
      .join(',');
    const updatedUser = await updateUserInfo(id, updateQueryArray);
    if(updatedUser) return res.json({
      error: null,
      data: updatedUser
    });
  }
  res.json({
    error: 'Ошибка обновления данных пользователя',
    data: null
  });
});

app.post('/update_avatar', authorize, upload.single('image'), async (req, res, next) => {
  const id = Number.parseInt(req.body.id);
  const image = req.file.buffer;
  const path = `images/avatars/id_${id}.png`;
  try {
    fs.writeFileSync(`public/${path}`, image);
  } catch(e) {
    return res.json({
      error: 'Ошибка сохранения аватара, попробуйте заново',
      data: null
    });
  }
  const updatedUser = await updateAvatar(id, path);
  if(updatedUser) return res.json({
    error: null,
    data: updatedUser
  });
  res.json({
    error: 'Ошибка загрузки, попробуйте заново',
    data: null
  });
});

app.post('/search', async(req, res) => {
  const query = req.body.query;
  const city = req.body.city;
  if(!query || !city) return res.json({
    data: null,
    error: 'Некорректный запрос'
  });
  var options = {
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
  }
  const data = await redis.get(city);
  if(!data) return res.json({
    data: null,
    error: 'Ошибка на стороне сервера, попробуйте позже'
  });
  const fuse = new fusejs(JSON.parse(data), options);
  const result = await fuse.search(query);
  res.json({
    data: result,
    error: null
  });
});

app.listen(process.env.PORT, () => {
  console.log(`UP & RUNNING ON ${process.env.PORT}`);
});
