// to keep consts away from file
import * as dotenv from 'dotenv';
dotenv.config();
// libraries
import express from 'express'
import cors from 'cors';
import bodyparser from 'body-parser';
import multer from 'multer';
// system consts
const app    = express();
const upload = multer();
const config = process.env;
// custom functions
import * as router from './router';
import { authorize as auth } from './middleware/auth';
// import { decode } from './middleware/citydecoder';
// express application configuration
app.use(cors());
app.use(bodyparser.json({limit: '50mb', extended: true}));
app.use(bodyparser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
// endpoints
app.post('/auth/send',    router.sendCode);
app.post('/auth/confirm', router.confirmCode);
app.post('/auth/refresh', router.refresh);

app.get('/friends/:id',          auth, router.friends);
app.post('/friends/add/:id',     auth, router.addFriend);
app.post('/friends/confirm/:id', auth, router.confirmFriend);
app.post('/friends/decline/:id', auth, router.declineFriend);
app.post('/friends/remove/:id',  auth, router.removeFriend);

app.get('/user/:id',              auth, router.seekUserByID);
app.post('/user/app',             auth, router.appInvite);
app.post('/user/update_info',     auth, router.updateUserInfo);
app.post('/user/update_avatar',   auth, upload.single('image'), router.updateAvatar);
app.post('/user/update_location', auth, router.updateUserLocation);

app.get('/parties',           auth, router.parties);
app.get('/party/:id',         auth, router.partyByID);
app.get('/party/guests/:pid', auth, router.guestList);
app.get('/party/rate/:id',    auth, router.rateGuest);
app.post('/party/rate',       auth, router.rate);
app.post('/party/join',       auth, router.joinParty);
app.post('/party/leave',      auth, router.leaveParty);
app.post('/party/create',     auth, router.createParty);
app.post('/party/modify',     auth, router.modifyParty);
app.post('/party/suspend',    auth, router.suspendParty);
app.post('/party/invite',     auth, router.inviteToParty);
app.post('/party/kick',       auth, router.kickGuest);

app.get('/seek',    auth, router.seek);
app.post('/places', auth, router.places);
app.post('/search', auth, router.search);
// running server
app.listen(config.PORT, () => {
  console.log(`UP & RUNNING ON ${config.PORT}`);
});
