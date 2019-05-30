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
  if(!phone) return null;
  return pool.connect((err, client, done) => {
    if(err) throw err;
    return client.query(`SELECT * FROM users WHERE phone='${phone}'`, (err, result) => {
      done();
      if(err) return null;
      return result.rows[0];
    });
  });
};

module.exports.userByID = (id = null) => {
  if(!id) return null;
  return pool.connect((err, client, done) => {
    if(err) return null;
    return client.query(`SELECT * FROM users WHERE id=${id}`, (err, result) => {
      done();
      if(err) return null;
      return result.rows[0];
    });
  });
};

module.exports.saveUser = (phone = null) => {
  if(!phone) return null;
  return pool.connect((err, client, done) => {
    if(err) return null;
    return client.query(`INSERT INTO users(phone) VALUES('${phone}') RETURNING *`, (err, result) => {
      done();
      if(err) return null;
      return result.rows[0];
    });
  });
};

module.exports.updateUserInfo = (id = null, fields = null) => {
  if(!id || !fields) return null;
  return pool.connect((err, client, done) => {
    if(err) throw err;
    return client.query(`UPDATE users SET ${fields} WHERE id = ${id} RETURNING *`, (err, result) => {
      done();
      if(err) return null;
      return resul.rows[0];
    });
  });
};

module.exports.updateAvatar = (id = null, path = null) => {
  if(!id || !path) return null;
  return pool.connect((err, client, done) => {
    if(err) throw err;
    return client.query(`UPDATE users SET avatar = '${path}' WHERE id = ${id} RETURNING *`, (err, result) => {
      done();
      if(err) return null;
      return result.rows[0];
    });
  });
};
