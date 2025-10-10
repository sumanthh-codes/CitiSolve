import pkg from 'pg';
const { Pool } = pkg;

const citizens = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'citizens', // your DB name
  password: 'user',
  port: 5432,
});

const staff = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'staff', // your DB name
  password: 'user',
  port: 5432,
});

const admin = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'admin', // your DB name
  password: 'user',
  port: 5432,
});

export {citizens,staff,admin};
