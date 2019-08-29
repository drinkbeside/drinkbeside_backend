import { dbpool } from './pool';

const pool = dbpool();

export const friendsByID = (id = null) => {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT DISTINCT UNNEST(ARRAY[user_id, friend_id]) FROM friends WHERE user_id = ${id} OR friend_id = ${id}`, (err, result) => {
        done();
        if (err) return resolve(null);
        const formatted = result.rows.filter(row => row != id);
        return resolve(formatted);
      });
    });
  });
};

export const addFriend = (uid = null, id = null) => {
  return new Promise(resolve => {
    if (!id || !uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM friends WHERE (user_id = ${uid} AND friend_id = ${uid}) OR (user_id = ${uid} AND friend_id = ${id})`, (err, result) => {
        if (!err) {
          console.log('tut');
          return resolve(null);
        }
        client.query(`INSERT INTO friends_pending(user_id, friend_id) VALUES(${uid}, ${id})`, (err, result) => {
          if (err) {
            console.log('tut 2', err);
            return resolve(null);
          }
          client.query(`SELECT * FROM users WHERE id = ${id}`, (err, result) => {
            done();
            if (err) {
              console.log('tut 2', err);
              return resolve(null);
            }
            return resolve(result.rows);
          });
        });
      });
    });
  });
};

export const confirmFriend = (uid = null, id = null) => {
  return new Promise(resolve => {
    if (!id || !uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT user_id FROM friends_pending WHERE friend_id = ${uid}`, (err, result) => {
        if (err) return resolve(null);
        client.query(`INSERT INTO friends(user_id, friend_id) VALUES(${id}, ${uid})`, (err, result) => {
          if (err) return resolve(null);
          client.query(`DELETE FROM friends_pending WHERE user_id = ${id} AND friend_id = ${uid}`, (err, result) => {
            if (err) return resolve(null);
            client.query(`SELECT * FROM users WHERE id = ${id}`, (err, result) => {
              done();
              if (err) return resolve(null);
              return resolve(result.rows);
            });
          });
        });
      });
    });
  });
};

export const declineFriend = (uid = null, id = null) => {
  return new Promise(resolve => {
    if (!id || !uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT user_id FROM friends_pending WHERE friend_id = ${uid}`, (err, result) => {
        if (err) return resolve(null);
        client.query(`DELETE FROM friends_pending WHERE user_id = ${id} AND friend_id = ${uid}`, (err, result) => {
          if (err) return resolve(null);
          client.query(`SELECT * FROM users WHERE id = ${id}`, (err, result) => {
            done();
            if (err) return resolve(null);
            return resolve(result.rows);
          });
        });
      });
    });
  });
};

export const removeFriend = (uid = null, id = null) => {
  return new Promise(resolve => {
    if (!id || !uid) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) return resolve(null);
      client.query(`SELECT * FROM friends WHERE (user_id = ${uid} AND friend_id = ${uid}) OR (user_id = ${uid} AND friend_id = ${id})`, (err, result) => {
        if (err) return resolve(null);
        client.query(`DELETE FROM friends WHERE (user_id = ${uid} AND friend_id = ${id}) OR (user_id = ${id} AND friend_id = ${uid})`, (err, result) => {
          done();
          if (err) return resolve(null);
          return resolve(result.rows);
        });
      });
    });
  });
};
