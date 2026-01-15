const bcrypt = require('bcrypt');
const db = require('../config/db');

// --- Logowanie Użytkownika ---
async function loginUser(req, res) {
    const { username, password } = req.body;
    try {
        const result = await db.query(
            'SELECT id, username, passwordhash, role FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Nieprawidłowy użytkownik.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.passwordhash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Nieprawidłowe hasło.' });
        }

        res.status(200).json({
            userId: user.id,
            role: user.role
        });
    } catch (error) {
        console.error('BŁĄD LOGOWANIA:', error.message);
        res.status(500).json({ error: 'Błąd serwera podczas logowania.' });
    }
}

// --- NOWA FUNKCJA: Pobieranie wszystkich użytkowników (Dla Admina) ---
async function getAllUsers(req, res) {
    try {
        // Nie zwracamy hasła dla bezpieczeństwa
        const result = await db.query('SELECT id, username, role FROM users ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania użytkowników:', error.message);
        res.status(500).json({ error: 'Błąd serwera.' });
    }
}

// --- NOWA FUNKCJA: Edycja Użytkownika (Login, Rola, opcjonalnie Hasło) ---
async function updateUser(req, res) {
    const { id } = req.params;
    const { username, role, password } = req.body;

    try {
        if (password && password.trim() !== "") {
            // Jeśli podano hasło, aktualizujemy wszystko (w tym hash)
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            await db.query(
                'UPDATE users SET username = $1, role = $2, passwordhash = $3 WHERE id = $4',
                [username, role, passwordHash, id]
            );
        } else {
            // Jeśli hasło puste, aktualizujemy tylko nazwę i rolę
            await db.query(
                'UPDATE users SET username = $1, role = $2 WHERE id = $3',
                [username, role, id]
            );
        }
        res.status(200).json({ message: 'Użytkownik zaktualizowany pomyślnie.' });
    } catch (error) {
        console.error('Błąd aktualizacji użytkownika:', error.message);
        res.status(500).json({ error: 'Błąd serwera.' });
    }
}

// --- T3: Reset hasła (Specyficzna funkcja tylko do hasła) ---
async function resetPasswordByAdmin(req, res) {
    const { userId } = req.params; // Uwaga: w routerze musi być :userId lub zmieniamy tu na :id
    // Dla spójności z updateUser użyjmy raczej req.params.id w routerze, ale zostawiam jak masz:
    const id = userId || req.params.id;
    const { newPassword } = req.body;

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        const result = await db.query(
            'UPDATE users SET passwordhash = $1 WHERE id = $2',
            [passwordHash, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }
        res.status(200).json({ message: 'Hasło zostało zmienione pomyślnie.' });
    } catch (error) {
        res.status(500).json({ error: 'Błąd serwera.' });
    }
}

// --- Tworzenie Użytkownika ---
async function createUser(req, res) {
    const { username, password, role = 'Klient' } = req.body;
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await db.query(
            'INSERT INTO users (username, passwordhash, role) VALUES ($1, $2, $3) RETURNING id',
            [username, passwordHash, role]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Użytkownik utworzony pomyślnie.' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Nazwa użytkownika jest już zajęta.' });
        }
        res.status(500).json({ error: error.message });
    }
}

// --- Usuwanie Użytkownika ---
async function deleteUser(req, res) {
    const userId = req.params.id;
    try {
        const result = await db.query('DELETE FROM users WHERE id = $1', [userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }
        res.status(200).json({ message: 'Użytkownik usunięty pomyślnie.' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Nie można usunąć użytkownika, ponieważ posiada powiązane zamówienia.' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    loginUser,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPasswordByAdmin
};