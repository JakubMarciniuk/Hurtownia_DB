// middleware/authMiddleware.js

/**
 * Uwaga: W prawdziwym systemie ten middleware pobierałby rolę z JWT tokena.
 * Tutaj zakładamy, że ID użytkownika jest przekazywane w nagłówku "X-User-ID"
 * i na tej podstawie pobieramy jego rolę z bazy danych.
 */
const db = require('../config/db');

/**
 * Funkcja sprawdzająca, czy użytkownik ma jedną z wymaganych ról.
 *
 * @param {string[]} requiredRoles - Tablica ról uprawnionych do dostępu (np. ['Administrator', 'Kierownik Sklepu']).
 */
const authorize = (requiredRoles) => async (req, res, next) => {
    // 1. Ustalenie ID użytkownika (symulacja autentykacji)
    // Symulujemy, że ID jest przekazywane w specjalnym nagłówku
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ message: 'Wymagane uwierzytelnienie (Brak nagłówka X-User-ID).' });
    }

    try {
        // 2. Pobranie roli użytkownika z bazy
        const userResult = await db.query(
            'SELECT Role FROM Users WHERE ID = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Użytkownik nie znaleziony.' });
        }

        const userRole = userResult.rows[0].role;

        // 3. Weryfikacja autoryzacji
        // Jeśli rola użytkownika to "Administrator", ma on dostęp do wszystkiego.
        if (userRole === 'Administrator' || requiredRoles.includes(userRole)) {
            // Dodajemy rolę do obiektu request, aby kontroler mógł jej użyć
            req.userRole = userRole;
            next(); // Przekazanie kontroli do następnego middleware/kontrolera
        } else {
            return res.status(403).json({ message: `Brak uprawnień. Rola: ${userRole}. Wymagane role: ${requiredRoles.join(', ')}.` });
        }

    } catch (error) {
        console.error('Błąd autoryzacji:', error);
        res.status(500).json({ message: 'Błąd serwera podczas weryfikacji uprawnień.' });
    }
};

module.exports = {
    authorize,
};