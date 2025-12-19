// server.js

const express = require('express');
const dotenv = require('dotenv');

// Ładowanie zmiennych środowiskowych ZAWSZE NA POCZĄTKU
dotenv.config();

const db = require('./config/db');
const ordersRoutes = require('./routes/ordersRoutes');
const usersRoutes = require('./routes/usersRoutes');
const productsRoutes = require('./routes/productsRoutes'); // Importujemy produkty!
const reportsRoutes = require('./routes/reportsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// === KLUCZOWY MIDDLEWARE: Parsowanie JSON ===
app.use(express.json());
// ===========================================

// Sprawdzenie połączenia z bazą danych
db.pool.query('SELECT NOW()')
    .then(res => {
        console.log('✅ Połączenie z PostgreSQL udane.');
    })
    .catch(err => {
        console.error('❌ Błąd połączenia z bazą danych! Sprawdź .env i pgAdmin.');
        console.error(err.message);
        process.exit(1);
    });

// Definicja głównych tras API
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/reports', reportsRoutes);

// Dodanie prostej trasy GET dla testu w przeglądarce
app.get('/', (req, res) => {
    res.send('API Hurtowni działa. Użyj Postman do testowania tras /api/orders, /api/users, /api/products.');
});


// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`🚀 Serwer Express działa na porcie ${PORT}`);
    console.log(`Aplikacja dostępna pod adresem: http://localhost:${PORT}`);
});