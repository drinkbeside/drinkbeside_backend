import * as dotenv from 'dotenv';
dotenv.config();
const config = process.env;

import { Pool } from 'pg';

let pool;

export const dbpool = () => {
  if (pool) return pool; // if it is already there, grab it here
  pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    max: 2000,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 2000,
  });
  pool.on('error', (err) => {
    console.log(err);
    process.exit(-1);
  });
  return pool;
};
