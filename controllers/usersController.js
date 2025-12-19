// controllers/usersController.js
const bcrypt = require('bcrypt');
const db = require('../config/db');

// --- T3: Zmiana Hasła (Reset hasła przez Admina) ---
async function resetPasswordByAdmin(req, res) {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Wymaganie NF03
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        const result = await db.query(
            'UPDATE Users SET PasswordHash = $1 WHERE ID = $2',
            [passwordHash, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }

        res.status(200).json({ message: 'Hasło użytkownika zmienione pomyślnie.' });
    } catch (error) {
        // Logika weryfikacji roli (F03) musiałaby być zaimplementowana w middleware,
        // a błąd zwracałby 403 Forbidden.
        console.error('Błąd T3 (Reset Hasła):', error);
        res.status(500).json({ error: 'Błąd serwera.' });
    }
}

// --- Tworzenie Użytkownika (INSERT) ---
async function createUser(req, res) {
    const { username, password } = req.body;
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await db.query(
            'INSERT INTO Users (Username, PasswordHash) VALUES ($1, $2) RETURNING ID',
            [username, passwordHash]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Użytkownik utworzony pomyślnie.' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Nazwa użytkownika jest już zajęta.' });
        }
        res.status(500).json({ error: error.message });
    }
}

// --- Usuwanie Użytkownika (DELETE) ---
async function deleteUser(req, res) {
    const userId = req.params.id;
    try {
        const result = await db.query('DELETE FROM Users WHERE ID = $1', [userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }
        res.status(200).json({ message: 'Użytkownik usunięty pomyślnie.' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Nie można usunąć użytkownika, ponieważ ma powiązane zamówienia.' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    resetPasswordByAdmin,
    createUser,
    deleteUser,
};