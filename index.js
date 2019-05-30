// to keep consts away from file
require('dotenv').config();
// libraries
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

app.use(cors());

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public'));

const authorize = async (req, res, next) => {
  return next();
  const id = req.body.id;
  const token = req.body.token;
  const savedToken = await redis.get(id);
  if(token === savedToken && jwt.verify(token)) return next();
  return res.json({
    error: 'Ошибка доступа по токену, вы должны быть авторизованы',
    data: null
  });
};

app.post('/send_code', async (req, res) => {
  const phone = req.body.phoneNumber;
  const random = Math.floor(100000 + Math.random() * 900000);
  await redis.set(phone, random);
  setTimeout(() => {
    redis.del(phone);
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
    let user = await userByPhone(phone.replace('+',''));
    if(!user) {
      user = await saveUser(phone);
    };
    console.log(user);
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
    error: 'Wrong code sent to server',
    data: null
  });
});

app.get('/user/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id);
  const user = await userByID(id);
  if(!user) return res.json({
    error: `Невозможно найти пользователя с ID ${id}`,
    data: null
  })
  res.json({
    error: null,
    data: user
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
    fs.writeFileSync('public/'+imagepath, image);
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

app.listen(process.env.PORT, () => {
  console.log(`UP & RUNNING ON ${process.env.PORT}`);
});
