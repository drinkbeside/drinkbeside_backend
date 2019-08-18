require('dotenv').config();
const { Pool } = require('pg');

const self = this;

const config = process.env;

const pool = new Pool({
  connectionString: config.DB_URL,
});

pool.on('error', (err) => process.exit(-1));

module.exports.userByPhone = (phone = null) => {
  return new Promise(resolve => {
    if (!phone) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM users WHERE phone = '${phone}'`, async (err, result) => {
        done();
        if (err) return resolve(null);
        const user = result.rows[0];
        if(!user) return resolve(user);
        const rating = await self.ratingByID(user.id);
        return resolve({
          ...user,
          rating: rating
        });
      });
    });
  });
};

module.exports.userByID = (id = null) => {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM users WHERE id = ${id}`, async (err, result) => {
        done();
        if (err) return resolve(null);
        const user = result.rows[0];
        const rating = await self.ratingByID(id);
        return resolve({
          ...user,
          rating: rating
        });
      });
    });
  });
};

module.exports.ratingByID = (id = null) => {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT rating FROM user_rating WHERE user_id = ${id} LIMIT 20`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows);
      });
    });
  });
};

module.exports.saveUser = (phone = null) => {
  return new Promise(resolve => {
    if (!phone) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      return client.query(`INSERT INTO users(phone) VALUES('${phone}') RETURNING *`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};

module.exports.updateUserInfo = (id = null, fields = null) => {
  return new Promise(resolve => {
    if (!id || !fields) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      return client.query(`UPDATE users SET ${fields} WHERE id = ${id} RETURNING *`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};

module.exports.updateRating = (uid = null, rid = null, rating = 5) => {
  return new Promise(resolve => {
    if (!uid || !rid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      return client.query(`INSERT INTO user_rating(user_id, reviewer_id, rating) VALUES(${uid}, ${rid}, ${rating})`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(true);
      });
    });
  });
};

module.exports.updateAvatar = (id = null, path = null) => {
  return new Promise(resolve => {
    if (!id || !path) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`UPDATE users SET avatar = '${path}' WHERE id = ${id} RETURNING *`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};

module.exports.createParty = ({
  hostID, invitedIDs, name, isFree,
  minPrice, maxPrice, address, type,
  start, end, minRating, limit
}) => {
  return new Promise(resolve => {
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`INSERT INTO parties(name, host_id, is_free, min_price, max_price, location, start_time, end_time, min_rating, type, invite_limit) VALUES('${name}', ${Number.parseInt(hostID)}, ${isFree}, ${Number.parseInt(minPrice)}, ${Number.parseInt(maxPrice)}, '${address}', ${Number.parseFloat(start)}, ${Number.parseFloat(end)}, ${Number.parseFloat(minRating)}, ${Number.parseInt(type)}, ${Number.parseInt(limit)}) RETURNING *`, (err, result) => {
        if (err) return resolve(null);
        const party = result.rows[0];
        if (invitedIDs.length > 1) {
          const formatted = invitedIDs.map(id => `(${party.id}, ${id})`);
          client.query(`INSERT INTO party_guests_pending(party_id, guest_id) VALUES ${formatted.join(',')}`, (err, result) => {
            done();
            if (err) return resolve(null);
            return resolve(party);
          });
        } else {
          done();
          return resolve(party);
        }
      });
    });
  });
};

module.exports.partyByID = (id = null) => {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM parties WHERE id = ${id}`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};

module.exports.fetchParties = (id = null) => {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM parties WHERE id IN (SELECT party_id FROM party_guests WHERE guest_id = ${id})`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows);
      });
    });
  });
};

module.exports.friendsByID = (id = null) => {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT friend_id FROM friends WHERE user_id = ${id}`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows);
      });
    });
  });
};

module.exports.inviteToParty = (pid = null, uid = null, gid = null) => {
  const error = { done: false, party: null, user: null };
  return new Promise(async resolve => {
    if (!pid || !uid || !gid) return resolve(error);
    const party = await self.partyByID(pid);
    if (!party || party.host_id !== uid) return resolve(error);
    const userToInvite = await self.userByID(gid);
    if (!userToInvite) return resolve(error);
    return pool.connect((err, client, done) => {
      if (err) return resolve(error);
      client.query(`INSERT INTO party_guests_pending(party_id, guest_id) VALUES(${pid}, ${gid})`, (err, result) => {
        done();
        if (err) return resolve(error);
        return resolve({
          done: true,
          party: party,
          user: userToInvite
        });
      });
    });
  });
};

module.exports.suspendParty = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await self.partyByID(pid);
    if (uid !== party.host_id) return resolve(null);
    if (party.is_suspended) return resolve(true);
    return pool.connect((err, client, done) => {
      console.log(err);
      if (err) return resolve(null);
      client.query(`UPDATE parties SET is_suspended=True WHERE id=${pid}`, (err, result) => {
        console.log(err);
        if (err) return resolve(null);
        return resolve(true);
      });
    });
  });
};

module.exports.modifyParty = (pid = null, uid = null, data = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid || !data) return resolve(null);
    const party = await self.partyByID(pid);
    if (uid !== party.host_id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`UPDATE parties SET ${fields} WHERE id = ${pid} RETURNING *`, (err, result) => {
        if (err) return resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};

module.exports.joinParty = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await self.partyByID(pid);
    const user = await self.userByID(uid);
    if (party.type === -1 || party.min_rating > user.rating ) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`INSERT INTO party_guests VALUES (${pid}, ${uid})`, (err, result) => {
        if(err) return resolve(null);
        client.query(`DELETE FROM party_guests_pending WHERE guest_id = ${uid} AND party_id = ${pid}`, (err, result) => {
          done();
          if (err) return resolve(null);
          return resolve(true);
        });
      });
    });
  });
};

module.exports.guestList = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await self.partyByID(pid);
    if (party.type === -1 && party.host_id !== uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT guest_id FROM party_guests WHERE party_id = ${pid}`, (err, result) => {
        done();
        if(err) return resolve(null);
        const rowIDs = result.rows.map(obj => obj.guest_id);
        return resolve(rowIDs);
      });
    });
  });
};

module.exports.guestListPending = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await self.partyByID(pid);
    if (party.type === -1 && party.host_id !== uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT guest_id FROM party_guests_pending WHERE party_id = ${pid}`, (err, result) => {
        done();
        if(err) return resolve(null);
        const rowIDs = result.rows.map(obj => obj.guest_id);
        return resolve(rowIDs);
      });
    });
  });
};

module.exports.fetchGuests = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await self.partyByID(pid);
    if (party.type === -1 && party.host_id !== uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM users WHERE id IN (SELECT guest_id FROM party_guests WHERE party_id = ${pid})`, (err, result) => {
        done();
        if(err) return resolve(null);
        console.log(result.rows);
        return resolve(result.rows);
      });
    });
  });
};

module.exports.fetchGuestsPending = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await self.partyByID(pid);
    if (party.type === -1 && party.host_id !== uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM users WHERE id IN (SELECT guest_id FROM party_guests_pending WHERE party_id = ${pid})`, (err, result) => {
        done();
        if(err) return resolve(null);
        console.log(result.rows);
        return resolve(result.rows);
      });
    });
  });
};

module.exports.kickGuest = (pid = null, uid = null, gid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid || !gid) return resolve(null);
    const party = await self.partyByID(pid);
    if (uid !== party.host_id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`DELETE FROM party_guests WHERE party_id = ${pid} AND guest_id = ${gid}`, (err, result) => {
        if (err) return resolve(null);
        done();
        return resolve(true);
      });
    });
  });
};

module.exports.kickGuestPending = (pid = null, uid = null, gid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid || !gid) return resolve(null);
    const party = await self.partyByID(pid);
    if (uid !== party.host_id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`DELETE FROM party_guests_pending WHERE party_id = ${pid} AND guest_id = ${gid}`, (err, result) => {
        if (err) return resolve(null);
        done();
        return resolve(true);
      });
    });
  });
};

module.exports.leaveParty = (pid = null, uid = null) => {
  return new Promise(resolve => {
    if (!pid || !uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`DELETE FROM party_guests WHERE party_id = ${pid} AND guest_id = ${uid}`, (err, result) => {
        if (err) return resolve(null);
        done();
        return resolve(true);
      });
    });
  });
};

module.exports.updateUserLocation = (uid = null, city = null) => {
  return new Promise(resolve => {
    if (!uid || !city) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`UPDATE users SET city = ${city} WHERE id = ${uid}`, (err, result) => {
        if (err) return resolve(null);
        done();
        return resolve(true);
      })
    })
  });
};

module.exports.declineInvitation = (pid = null, uid = null) => {
  return new Promise(resolve => {
    if (!pid || !uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`DELETE FROM party_guests_pending WHERE party_id = ${pid} AND guest_id = ${uid}`, (err, result) => {
        if (err) return resolve(null);
        done();
        return resolve(true);
      });
    });
  });
};
