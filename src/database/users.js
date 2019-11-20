import { dbpool } from './pool';

const pool = dbpool();

export const userByPhone = (phone = null) => {
  return new Promise(resolve => {
    if (!phone) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) {
        console.log(err);
        return resolve(null);
      }
      client.query(`SELECT * FROM users WHERE phone = '${phone}'`, async (err, result) => {
        done();
        if (err) {
          console.log(err);
          return resolve(null);
        }
        const user = result.rows[0];
        if(!user) return resolve(null);
        const rating = await ratingByID(user.id);
        return resolve({
          ...user,
          rating: rating
        });
      });
    });
  });
};

export const userByID = (id = null) => {
  return new Promise(resolve => {
    console.log(1);
    if (!id) return resolve(null);
    console.log(2);

    return pool.connect((err, client, done) => {
      console.log(3);

      if (err) return resolve(null);
      console.log(4);

      client.query(`SELECT * FROM users WHERE id = ${id}`, async (err, result) => {
        done();
        if (err) return resolve(null);
        const user = result.rows[0];
        const rating = await ratingByID(id);
        return resolve({
          ...user,
          rating: rating
        });
      });
    });
  });
};

export const userByInput = (input = null) => {
  return new Promise(resolve => {
    if(!input) return resolve(null);
    const parsed = Number.parseInt(input) || null;
    if(!parsed) return resolve(null);
    return pool.connect((err, client, done) => {
      if(err) return resolve(null);
      client.query(`SELECT * FROM users WHERE id = ${parsed} OR phone = ${'' + resu}`, async (err, result) => {
        done();
        if(err) return resolve(null);
        const user = result.rows[0];
        const rating = await ratingByID(user.id);
        return resolve({
          ...user,
          rating: rating
        });
      });
    });
  });
};

export const ratingByID = (id = null) => {
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

export const saveUser = (phone = null) => {
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

export const updateUserInfo = (id = null, fields = null) => {
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

export const updateRating = (uid = null, rid = null, rating = 5) => {
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

export const updateAvatar = (id = null, path = null) => {
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


export const updateUserFcmToken = (uid = null, token = null) => {
  return new Promise(resolve => {
    if (!uid || !token) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) {
        console.log('БД пизда');
        console.log(err);
        return resolve(null);
      }
      client.query(`UPDATE users SET fcmToken = '${token}' WHERE id = ${uid} RETURNING *`, (err, result) => {
        if (err) {
          console.log(err);
          return resolve(null);
        }
        done();
        return resolve(result.rows[0]);
      })
    })
  });
};


export const updateUserLocation = (uid = null, city = null) => {
  return new Promise(resolve => {
    if (!uid || !city) return resolve(null);
    return pool.connect((err, client, done) => {
      if (err) {
        console.log('БД пизда');
        console.log(err);
        return resolve(null);
      }
      client.query(`UPDATE users SET city = '${city}' WHERE id = ${uid} RETURNING *`, (err, result) => {
        if (err) {
          console.log(err);
          return resolve(null);
        }
        done();
        return resolve(result.rows[0]);
      })
    })
  });
};
