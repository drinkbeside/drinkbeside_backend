import { dbpool } from './pool';

const pool = dbpool();

export const guestList = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await partyByID(pid);
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

export const guestListPending = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await partyByID(pid);
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

export const fetchGuests = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await partyByID(pid);
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

export const fetchGuestsPending = (pid = null, uid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid) return resolve(null);
    const party = await partyByID(pid);
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

export const kickGuest = (pid = null, uid = null, gid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid || !gid) return resolve(null);
    const party = await partyByID(pid);
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

export const kickGuestPending = (pid = null, uid = null, gid = null) => {
  return new Promise(async resolve => {
    if (!pid || !uid || !gid) return resolve(null);
    const party = await partyByID(pid);
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
