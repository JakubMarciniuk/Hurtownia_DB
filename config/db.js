// config/db.js
const { Pool } = require('pg');
// require('dotenv') jest ładowane w server.js

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false
});

module.exports = {
    // Eksportuj pulę do zarządzania transakcjami (BEGIN/COMMIT/ROLLBACK)
    pool,
    // Funkcja pomocnicza do prostych zapytań
    query: (text, params) => pool.query(text, params),
};