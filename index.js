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
  userByInput,
  saveUser,
  updateUserInfo,
  updateRating,
  updateAvatar,
  partyByID,
  fetchParties,
  createParty,
  inviteToParty,
  suspendParty,
  modifyParty,
  joinParty,
  guestList,
  guestListPending,
  fetchGuests,
  fetchGuestsPending,
  kickGuest,
  kickGuestPending,
  leaveParty,
  declineInvitation,
  friendsByID,
  addFriend,
  removeFriend,
  confirmFriend,
  declineFriend
} = require('./database/postgres');
const { fetchPlaces } = require('./middleware/places');
const { authorize } = require('./middleware/auth');
const { decode } = require('./middleware/citydecoder');
// express application configuration
app.use(cors());
app.use(bodyparser.json({limit: '50mb', extended: true}));
app.use(bodyparser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
// sign up & sign in endpoints
app.post('/send_code', async (req, res) => {
  const phone = req.body.phoneNumber;
  const random = Math.floor(100000 + Math.random() * 900000);
  await redis.set(phone.replace('+', ''), random);
  setTimeout(() => {
    redis.del(phone.replace('+', ''));
  }, process.env.SMS_TIMEOUT);
  const toSend = process.env.DEF_URL
    .replace('<phones>', phone)
    .replace('<message>', random);
  try {
    const response = await axios.get(toSend);
    res.json({
      error: null,
      data: 'Код отправлен'
    });
  } catch (e) {
    res.status(500).json({
      error: 'Ошибка отправки проверочного кода',
      data: null
    });
  }
});

app.post('/confirm_code', async (req, res) => {
  const phone = req.body.phoneNumber.replace('+', '');
  const code = req.body.code;
  const codeKept = await redis.get(phone);
  if (codeKept && codeKept === code) {
    let user = await userByPhone(phone);
    if (!user) {
      user = await saveUser(phone);
    };
    if (user) {
      await redis.del(phone);
      const access = jwt.sign({ user }, process.env.SECRET, { expiresIn: '20m' });
      const refresh = jwt.sign({ access }, process.env.SECRET, { expiresIn: '1w' });
      await redis.set(access, user);
      await redis.set(refresh, access);
      return res.json({
        error: null,
        data: { ...user, access, refresh }
      });
    }
  }
  res.status(400).json({
    error: 'Вы прислали неверный код',
    data: null
  });
});

app.post('/refresh', async (req, res) => {
  const refresher = req.headers.refresh;
  return await jwt.verify(refresher, process.env.SECRET, async (err, decoded) => {
    if(err || decoded.expired) return res.status(401).json({
      error: 'Время жизни токена исчерпано',
      data: null
    });
    const token = await redis.get(refresher);
    if(!token) return res.status(403).json({
      error: 'Неверный токен',
      data: null
    });
    return await jwt.verify(token, process.env.SECRET, async (err, decoded) => {
      await redis.del(refresher);
      await redis.del(token);
      const user = decoded;
      const access = jwt.sign({ user }, process.env.SECRET, { expiresIn: '20m' });
      const refresh = jwt.sign({ access }, process.env.SECRET, { expiresIn: '1w' });
      await redis.set(access, user);
      await redis.set(refresh, access);
      return res.json({
        error: null,
        data: { ...user, access, refresh }
      });
    });
  });
});
// end of sign up & sign in endpoints
// user related endpoints
app.get('/seek', authorize, async (req, res) => {
  const query = req.query.input;
  const user = await userByInput(query);
  if(!user) return res.status(404).json({
    error: `Невозможно найти пользователя по ${query}`,
    data: null
  });
  res.json({
    error: null,
    data: {
      ...user
    }
  });
});


app.get('/user/:id', authorize, async (req, res) => {
  const id = Number.parseInt(req.params.id);
  const user = await userByID(id);
  if (!user) return res.status(404).json({
    error: `Невозможно найти пользователя с ID ${id}`,
    data: null
  });
  res.json({
    error: null,
    data: {
      ...user
    }
  });
});

app.get('/parties', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const id = user.id;
  const parties = await fetchParties(id);
  const partiesFormatted = await parties.map(async party => {
    const partyID = party.id;
    const list = await guestList(partyID, id);
    const listPending = await guestListPending(partyID, id);
    return {
      ...party,
      guests: list.length,
      pending_guests: listPending.length
    };
  });
  if(!parties) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора событий, попробуйте позже'
  });
  Promise.all(partiesFormatted).then(result => {
    res.json({
      data: result,
      error: null
    });
  });
});

app.get('/friends/:id', authorize, async (req, res) => {
  const id = req.params.id;
  const friends = await fetchFriends(id);
  if(!friends) return res.status(500).json({
    data: null,
    error: 'Ошибка подбора друзей, попробуйте позже'
  });
  res.json({
    data: friends,
    error: null
  });
});

app.post('/friends/add/:id', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const uid = user.id;
  const id = req.params.id;
  const added = await addFriend(uid, id);
  if(!added) return res.status(500).json({
    data: null,
    error: 'Ошибка добавления в друзья, попробуйте позже'
  });
  res.json({
    data: true,
    error: null
  });
});

app.post('/friends/confirm/:id', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const uid = user.id;
  const id = req.params.id;
  const added = await confirmFriend(uid, id);
  if(!added) return res.status(500).json({
    data: null,
    error: 'Ошибка добавления в друзья, попробуйте позже'
  });
  res.json({
    data: true,
    error: null
  });
});

app.post('/friends/decline/:id', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const uid = user.id;
  const id = req.params.id;
  const added = await declineFriend(uid, id);
  if(!added) return res.status(500).json({
    data: null,
    error: 'Ошибка добавления в друзья, попробуйте позже'
  });
  res.json({
    data: true,
    error: null
  });
});

app.post('/friends/remove/:id', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const uid = user.id;
  const id = req.params.id;
  const added = await removeFriend(uid, id);
  if(!added) return res.status(500).json({
    data: null,
    error: 'Ошибка удаления из друзей, попробуйте позже'
  });
  res.json({
    data: true,
    error: null
  });
});

app.post('/update_user_info', authorize, async (req, res) => {
  const data = req.body;
  const id = Number.parseInt(data.id);
  const user = await userByID(id);
  if (user) {
    const updateQueryArray = Object.keys(data.fields)
      .filter(key => key !== 'id' && key !== 'avatar')
      .map(key => `${key} = '${data.fields[key]}'`)
      .join(',');
    const updatedUser = await updateUserInfo(id, updateQueryArray);
    if (updatedUser) return res.json({
      error: null,
      data: updatedUser
    });
  }
  res.status(500).json({
    error: 'Ошибка обновления данных пользователя',
    data: null
  });
});

app.post('/update_avatar', authorize, upload.single('image'), async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const id = user.id;
  const image = req.file.buffer;
  const path = `images/avatars/id_${id}.png`;
  try {
    fs.writeFileSync(`public/${path}`, image);
  } catch (e) {
    return res.status(500).json({
      error: 'Ошибка сохранения аватара, попробуйте заново',
      data: null
    });
  }
  const updatedUser = await updateAvatar(id, path);
  if (updatedUser) return res.json({
    error: null,
    data: updatedUser
  });
  res.status(500).json({
    error: 'Ошибка загрузки, попробуйте заново',
    data: null
  });
});

app.post('/rate', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const guestID = req.body.guest_id;
  const rating = Number.parseInt(req.body.rating);
  if(!guestID || !rating) return res.status(400).json({
    data: null,
    error: 'Переданы не все необходимые параметры'
  });
  const updatedUser = await updateRating(guestID, userID, rating);
  if(!updatedUser) return res.status(500).json({
    data: null,
    error: 'Невозможно поставить оценку пользователю'
  });
  res.json({
    data: `Рейтинг пользователя ${updatedUser.fname} ${updatedUser.lname} обновлен`,
    error: null
  });
});

app.post('/join_party', authorize async (req, res) => {
  const partyID = req.body.partyID;
  const userID = Number.parseInt(req.headers.id);
  done = await joinParty(partyID, userID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка присоединения'
  });
  res.json({
    data: done,
    error: null
  });
});

app.post('/leave_party', authorize, async (req, res) => {
  const partyID = req.body.partyID;
  const userID = Number.parseInt(req.headers.id);
  const done = await leaveParty(partyID, userID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка исключения пользователя'
  });
  res.json({
    data: done,
    error: null
  });
});

app.post('/update_user_location', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const city = req.body.city;
  const done = await updateUserLocation(userID, city);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка изменения города пользователя'
  });
  res.json({
    data: done,
    error: null
  });
});

// end of user related endpoints
// places related endpoints

app.post('/places', authorize, async (req, res) => {
  await fetchPlaces(res, req.body.city);
});

app.post('/search', authorize, async (req, res) => {
  const query = req.body.query;
  const city = req.body.city;
  if (!query || !city) return res.json({
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
});
// end of places related endpoints
// party/event related endpoints
app.get('/party/:id', authorize, async (req, res) => {
  const id = req.params.id;
  const party = await partyByID(id);
  if (!party) return res.status(404).json({
    data: null,
    error: 'Данного события не существует'
  });
  res.json({
    data: party,
    error: null
  });
});

app.post('/create_party', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const uid = user.id;
  const hostID = req.body.hostID;
  const invitedIDs = req.body.invitedIDs || [];
  const name = req.body.name;
  const isFree = req.body.isFree;
  const minPrice = req.body.minPrice || 0;
  const maxPrice = req.body.maxPrice || 0;
  const address = req.body.address;
  const type = req.body.type || 0;
  const start = req.body.start;
  const end = req.body.end || 0;
  const minRating = req.body.minRating || 0.0;
  const limit = req.body.limit || 0;
  if (!hostID || !name || !isFree || !address || !start) return res.json({
    data: null,
    error: 'Указаны не все обязательные поля'
  });
  const party = await createParty({
    hostID, invitedIDs, name, isFree,
    minPrice, maxPrice, address, type,
    start, end, minRating, limit
  });
  if(!party) return res.status(500).json({
    data: null,
    error: 'Невозможно создать событие'
  });
  done = await joinParty(party.id, uid);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка создания тусовки'
  });
  res.json({
    data: party,
    error: null
  });
});

app.post('/modify_party', authorize, async (req, res) => {
  const partyID = req.body.partyID;
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const fields = req.body.fields;
  const updateQueryArray = Object.keys(fields)
    .filter(key => !(key in ['id', 'host_id', 'is_suspended']))
    .map(key => `${key} = '${fields[key]}'`)
    .join(',');
  const done = await modifyParty(partyID, userID, updateQueryArray);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка изменения параметров события'
  });
  res.json({
    data: done,
    error: null
  });
});

app.post('/suspend_party', authorize, async (req, res) => {
  const partyID = req.body.party_id;
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const done = await suspendParty(partyID, userID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка приостановки события.'
  });
  res.json({
    data: done,
    error: null
  });
});

app.post('/invite_to_party', authorize, async (req, res) => {
  const partyID = req.body.party_id;
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const guestID = req.body.guest_id;
  const { done, party, updatedUser } = await inviteToParty(partyID, userID, guestID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка на стороне сервера, либо вы не хост события'
  });
  res.json({
    data: `Вы пригласили ${updatedUser.name} на ${party.name}`,
    error: null
  });
});

app.get('/guest_list/:pid', authorize, async (req,res) => {
  const partyID = req.params.pid;
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const list = await fetchGuests(partyID, userID);
  const listPending = await fetchGuestsPending(partyID, userID);
  if (!list) return res.status(403).json({
    data: null,
    error: 'Ошибка получения списка участников'
  });
  res.json({
    data: {
      going: list,
      pending: listPending
    },
    error: null
  });
});

app.get('/rate_guests/:id', authorize, async (req, res) => {
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const partyID = req.params.id;
  if(!userID || !partyID) return res.json({
    data: null,
    error: 'Переданы не все необходимые параметры'
  });
  const guests = await fetchGuests(userID, partyID);
  if(!guests) return res.status(403).json({
    data: null,
    error: 'Скорее всего Вы не являетесь хостом события, либо события не существует'
  });
  res.json({
    data: guests,
    error: null
  });
});

app.post('/kick_guest', authorize, async (req, res) => {
  const partyID = req.body.partyID;
  const user = await jwt.verify(req.headers.access, process.env.SECRET);
  const userID = user.id;
  const guestID = req.body.guestID;
  const done = await kickGuest(partyID, userID, guestID);
  if (!done) return res.status(500).json({
    data: null,
    error: 'Ошибка исключения пользователя'
  });
  res.json({
    data: done,
    error: null
  });
});
// end of party/event related endpoints
// running server
app.listen(process.env.PORT, () => {
  console.log(`UP & RUNNING ON ${process.env.PORT}`);
});
