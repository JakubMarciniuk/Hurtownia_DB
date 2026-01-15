const express = require('express');
const dotenv = require('dotenv');
const db = require('./config/db');

// Importy tras
const ordersRoutes = require('./routes/ordersRoutes');
const usersRoutes = require('./routes/usersRoutes');
const productsRoutes = require('./routes/productsRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

// Konfiguracja
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARE (Tylko JSON, bez CORS) ===
app.use(express.json());

// Sprawdzenie bazy
db.pool.query('SELECT NOW()')
    .then(() => console.log('✅ Połączenie z PostgreSQL udane.'))
    .catch(err => {
        console.error('❌ Błąd bazy danych:', err.message);
        process.exit(1);
    });

// Definicja tras
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/reports', reportsRoutes);

// Testowa trasa
app.get('/', (req, res) => {
    res.send('API działa. Frontend powinien łączyć się przez Proxy.');
});

app.listen(PORT, () => {
    console.log(`🚀 Serwer Backend działa na porcie ${PORT}`);
});