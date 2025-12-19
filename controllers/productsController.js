// controllers/productsController.js
const db = require('../config/db');

// --- Tworzenie Produktu (INSERT) ---
async function createProduct(req, res) {
    const { name, price, stock } = req.body;
    try {
        if (!name || typeof price !== 'number' || typeof stock !== 'number' || price <= 0 || stock < 0) {
            return res.status(400).json({ message: 'Brakuje wymaganych pól lub dane są nieprawidłowe (cena > 0, stock >= 0).' });
        }

        const result = await db.query(
            'INSERT INTO Products (Name, Price, Stock) VALUES ($1, $2, $3) RETURNING ID',
            [name, price, stock]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Produkt dodany pomyślnie.' });
    } catch (error) {
        console.error('Błąd tworzenia produktu:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
}

// --- T2: Usuwanie Produktu (DELETE) ---
// Logika uwzględnia niestandardową regułę integralności (TRIGGER SQL).
async function deleteProduct(req, res) {
    const productId = req.params.id;
    try {
        const result = await db.query('DELETE FROM Products WHERE ID = $1', [productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produkt nie znaleziony.' });
        }
        return res.status(200).json({ message: 'Produkt usunięty pomyślnie.' });

    } catch (error) {
        // Obsługa błędu rzuconego przez trigger SQL (NF01)
        if (error.message.includes('aktywnych zamówień')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error('Błąd usuwania produktu (T2):', error);
        return res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
}

// --- T2: Aktualizacja stanu magazynowego (UPDATE Stock) ---
async function updateStock(req, res) {
    const productId = req.params.id;
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: 'Wymagana jest prawidłowa wartość stanu magazynowego (>= 0).' });
    }

    try {
        const result = await db.query(
            'UPDATE Products SET Stock = $1 WHERE ID = $2 RETURNING ID',
            [stock, productId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produkt nie znaleziony.' });
        }
        res.status(200).json({ message: 'Stan magazynowy zaktualizowany.' });
    } catch (error) {
        console.error('Błąd aktualizacji stanu magazynowego:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
}

// --- T2: Aktualizacja ceny (UPDATE Price) ---
async function updatePrice(req, res) {
    const productId = req.params.id;
    const { price } = req.body;

    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ message: 'Wymagana jest prawidłowa cena (> 0).' });
    }

    try {
        const result = await db.query(
            'UPDATE Products SET Price = $1 WHERE ID = $2 RETURNING ID',
            [price, productId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produkt nie znaleziony.' });
        }
        res.status(200).json({ message: 'Cena produktu zaktualizowana.' });
    } catch (error) {
        console.error('Błąd aktualizacji ceny:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
}

module.exports = {
    createProduct,
    deleteProduct,
    updateStock,
    updatePrice,
};