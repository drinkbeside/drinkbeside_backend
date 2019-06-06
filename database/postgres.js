const { Pool } = require('pg');
require('dotenv').config();

const self = this;

const config = process.env;

const pool = new Pool({
  connectionString: config.DB_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
});

module.exports.userByPhone = (phone = null) => {
  return new Promise(resolve => {
    if (!phone) return resolve(null);
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM users WHERE phone='${phone}'`, (err, result) => {
        done();
        if (err) return resolve(null);
        resolve(result.rows[0]);
      });
    });
  });
};

module.exports.userByID = (id = null) => {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM users WHERE id=${id}`, (err, result) => {
        done();
        if (err) return resolve(null);
        return resolve(result.rows[0]);
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

module.exports.updateAvatar = (id = null, path = null) => {
  return new Promise(resolve => {
    if (!id || !path) return resolve(null);
    pool.connect((err, client, done) => {
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
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`INSERT INTO parties(name, host_id, is_free, min_price, max_price, location, start_time, end_time, min_rating, type, invite_limit) VALUES('${name}', ${Number.parseInt(hostID)}, ${isFree}, ${Number.parseInt(minPrice)}, ${Number.parseInt(maxPrice)}, '${address}', ${Number.parseFloat(start)}, ${Number.parseFloat(end)}, ${Number.parseFloat(minRating)}, ${Number.parseInt(type)}, ${Number.parseInt(limit)}) RETURNING *`, (err, result) => {
        if (err) return resolve(null);
        const party = result.rows[0];
        if (invitedIDs.length > 1) {
          const formatted = invitedIDs.map(id => `(${party.id}, ${id})`);
          client.query(`INSERT INTO party_guests(party_id, guest_id) VALUES ${formatted.join(',')}`, (err, result) => {
            done();
            if (err) return resolve(null);
            resolve(party);
          });
        } else {
          done();
          resolve(party);
        }
      });
    });
  });
};

module.exports.partyByID = (id) => {
  return new Promise(resolve => {
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM parties WHERE id = ${id}`, (err, result) => {
        done();
        if (err) return resolve(null);
        resolve(result.rows[0]);
      });
    });
  });
};

module.exports.inviteToParty = (pid, uid, gid) => {
  const error = { done: false, party: null, user: null };
  return new Promise(async resolve => {
    const party = await self.partyByID(pid);
    if (!party || party.host_id !== uid) return resolve(error);
    const userToInvite = await self.userByID(gid);
    if (!userToInvite) return resolve(error);
    pool.connect((err, client, done) => {
      if (err) return resolve(error);
      client.query(`INSERT INTO party_guests(party_id, guest_id) VALUES(${pid}, ${gid})`, (err, result) => {
        done();
        if (err) return resolve(error);
        resolve({
          done: true,
          party: party,
          user: userToInvite
        });
      });
    });
  });
};

module.exports.suspendParty = (pid, uid) => {
  return new Promise(async resolve => {
    // TODO: epop xehdluhg
    const party = await self.partyByID(pid);
    console.log(party.host_id, uid);
    if (uid !== party.host_id) return resolve(null);
    if (party.is_suspended) return resolve(true);
    pool.connect((err, client, done) => {
      console.log(err);
      if (err) return resolve(null);
      client.query(`UPDATE parties SET is_suspended=True WHERE id=${pid}`, (err, result) => {
        console.log(err);
        if (err) return resolve(null);
        resolve(true);
      });
    });
  });
};

module.exports.modifyParty = (pid, uid, data) => {
  return new Promise(async resolve => {
    // TODO: epop xehdluhg
    const party = await self.partyByID(pid);
    if (uid !== party.host_id) return resolve(null);
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`UPDATE parties SET ${fields} WHERE id = ${pid} RETURNING *`, (err, result) => {
        if (err) return resolve(null);
        resolve(result.rows[0]);
      });
    });

  });
};

module.exports.guestList = (pid, uid) => {
  return new Promise(async resolve => {
    const party = await partyByID(pid);
    if (party.type===-1 && party.host_id!==uid) return resolve(null);
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT guest_id FROM party_guests WHERE party_id = ${pid}`, (err, result) => {
        done();
        if(err) return resolve(null);
        resolve(result.rows[0]);
      });
    })
  })
}

module.exports.kickGuest = (pid, uid, gid) => {
  return new Promise(async resolve => {
    const party = await self.partyByID(pid);
    if (uid !== party.host_id) return resolve(null);
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`DELETE FROM party_guests WHERE party_id = ${pid} AND guest_id = ${gid}`, (err, result) => {
        if (err) return resolve(null);
        done();
        resolve(true);
      });
    });
  });
};

module.exports.leaveParty = (pid, uid) => {
  return new Promise(resolve => {
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`DELETE FROM party_guests WHERE party_id = ${pid} AND guest_id = ${uid}`, (err, result) => {
        if (err) return resolve(null);
        done();
        resolve(true);
      });
    });
  });
};

module.exports.getCities = () => {
  return new Promise(resolve => {
    pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM cities`, (err, result) => {
        if (err) return resolve(null);
        done();
        resolve(result.rows);
      });
    });
  });
};