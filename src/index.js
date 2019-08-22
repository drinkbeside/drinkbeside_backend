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
import { authorize } from './middleware/auth';
// import { decode } from './middleware/citydecoder';
// express application configuration
app.use(cors());
app.use(bodyparser.json({limit: '50mb', extended: true}));
app.use(bodyparser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
// endpoints
app.post('/auth/send', router.sendCode);
app.post('/auth/confirm', router.confirmCode);
app.post('/auth/refresh', router.refresh);

app.get('/friends/:id', authorize, router.friends);
app.post('/friends/add/:id', authorize, router.addFriend);
app.post('/friends/confirm/:id', authorize, router.confirmFriend);
app.post('/friends/decline/:id', authorize, router.declineFriend);
app.post('/friends/remove/:id', authorize, router.removeFriend);

app.get('/user/:id', authorize, router.seekUserByID);
app.post('/user/advertise', authorize, router.appInvite);
app.post('/user/update_info', authorize, router.updateUserInfo);
app.post('/user/update_avatar', authorize, upload.single('image'), router.updateAvatar);
app.post('/user/update_location', authorize, router.updateUserLocation);
app.post('/user/invite', authorize, router.inviteToParty);

app.get('/parties', authorize, router.parties);
app.get('/party/:id', authorize, router.partyByID);
app.get('/party/guests/:pid', authorize, router.guestList);
app.get('/party/rate/:id', authorize, router.rateGuest);
app.post('/party/rate', authorize, router.rate);
app.post('/party/join', authorize, router.joinParty);
app.post('/party/leave', authorize, router.leaveParty);
app.post('/party/create', authorize, router.createParty);
app.post('/party/modify', authorize, router.modifyParty);
app.post('/party/suspend', authorize, router.suspendParty);
app.post('/party/kick', authorize, router.kickGuest);

app.get('/seek', authorize, router.seek);
app.post('/places', authorize, router.places);
app.post('/search', authorize, router.search);
// running server
app.listen(config.PORT, () => {
  console.log(`UP & RUNNING ON ${config.PORT}`);
});
