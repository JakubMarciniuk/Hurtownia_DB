// config/db.js
const { Pool } = require('pg');

// 1. WYMUŚ ŁADOWANIE ZMIENNYCH TUTAJ
// Dzięki temu mamy pewność, że są dostępne zanim utworzymy Pool
require('dotenv').config();

// 2. DIAGNOSTYKA (Pokaże w konsoli, co widzi ten plik)
console.log('--- DB CONFIG DEBUG ---');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD (typ):', typeof process.env.DB_PASSWORD); // Musi być 'string'
console.log('DB_PASSWORD (len):', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('-----------------------');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, // Tu trafia hasło "squelik"
    port: process.env.DB_PORT,
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
};