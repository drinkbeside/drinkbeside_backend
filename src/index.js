// to keep consts away from file
import * as dotenv from 'dotenv';
dotenv.config();
// libraries
import express from 'express'
import cors from 'cors';
import bodyparser from 'body-parser';
import multer from 'multer';
// system consts
const app = express();
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
app.post('/send_code', router.sendCode);
app.post('/confirm_code', router.confirmCode);
app.post('/app_invite', authorize, router.appInvite);
app.post('/refresh', router.refresh);
app.get('/seek', authorize, router.seek);
app.get('/user/:id', authorize, router.seekUserByID);
app.get('/parties', authorize, router.parties);
app.get('/friends/:id', authorize, router.friends);
app.post('/friends/add/:id', authorize, router.addFriend);
app.post('/friends/confirm/:id', authorize, router.confirmFriend);
app.post('/friends/decline/:id', authorize, router.declineFriend);
app.post('/friends/remove/:id', authorize, router.removeFriend);
app.post('/update_user_info', authorize, router.updateUserInfo);
app.post('/update_avatar', authorize, upload.single('image'), router.updateAvatar);
app.post('/update_user_location', authorize, router.updateUserLocation);
app.post('/rate', authorize, router.rate);
app.post('/join_party', authorize, router.joinParty);
app.post('/leave_party', authorize, router.leaveParty);
app.post('/places', authorize, router.places);
app.post('/search', authorize, router.search);
app.get('/party/:id', authorize, router.partyByID);
app.post('/create_party', authorize, router.createParty);
app.post('/modify_party', authorize, router.modifyParty);
app.post('/suspend_party', authorize, router.suspendParty);
app.post('/invite_to_party', authorize, router.inviteToParty);
app.get('/guest_list/:pid', authorize, router.guestList);
app.get('/rate_guests/:id', authorize, router.rateGuest);
app.post('/kick_guest', authorize, router.kickGuest);
// running server
app.listen(config.PORT, () => {
  console.log(`UP & RUNNING ON ${config.PORT}`);
});
