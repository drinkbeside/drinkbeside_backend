import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import { Pool } from 'pg';

let pool;

export const dbpool = () => {
  if (pool) return pool; // if it is already there, grab it here
  pool = new Pool({
    connectionString: config.DB_URL,
  });
  pool.on('error', (err) => {
    console.log(err);
    process.exit(-1);
  });
  return pool;
};
