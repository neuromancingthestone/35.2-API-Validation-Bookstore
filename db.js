/** Database config for database. */


const { Client } = require("pg");
const {DB_URI} = require("./config");

let db = new Client({
  database: DB_URI,
  user: 'robleo',
  password: 'pass',
});

db.connect();


module.exports = db;
