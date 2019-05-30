const { Pool } = require('pg');
require('dotenv').config();

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
    if(!phone) resolve(null);
    pool.connect((err, client, done) => {
      if(err) resolve(null);
      client.query(`SELECT * FROM users WHERE phone='${phone}'`, (err, result) => {
        done();
        if(err) resolve(null);
        resolve(result.rows[0]);
      });
    });
  });
};

module.exports.userByID = (id = null) => {
  return new Promise(resolve => {
    if(!id) resolve(null);
    pool.connect((err, client, done) => {
      if(err) resolve(null);
      client.query(`SELECT * FROM users WHERE id=${id}`, (err, result) => {
        done();
        if(err) resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};

module.exports.saveUser = (phone = null) => {
  return new Promise(resolve => {
    if(!phone) resolve(null);
    return pool.connect((err, client, done) => {
      if(err) resolve(null);
      return client.query(`INSERT INTO users(phone) VALUES('${phone}') RETURNING *`, (err, result) => {
        done();
        if(err) resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};

module.exports.updateUserInfo = (id = null, fields = null) => {
  return new Promise(resolve => {
    if(!id || !fields) resolve(null);
    return pool.connect((err, client, done) => {
      if(err) resolve(null);
      return client.query(`UPDATE users SET ${fields} WHERE id = ${id} RETURNING *`, (err, result) => {
        done();
        if(err) resolve(null);
        return resolve(resul.rows[0]);
      });
    });
  });
};

module.exports.updateAvatar = (id = null, path = null) => {
  return new Promise(resolve => {
    if(!id || !path) resolve(null);
    pool.connect((err, client, done) => {
      if(err) resolve(null);
      client.query(`UPDATE users SET avatar = '${path}' WHERE id = ${id} RETURNING *`, (err, result) => {
        done();
        if(err) resolve(null);
        return resolve(result.rows[0]);
      });
    });
  });
};
