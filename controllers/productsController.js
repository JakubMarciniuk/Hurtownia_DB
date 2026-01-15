const db = require('../config/db');

// Pobieranie wszystkich produktów
async function getAllProducts(req, res) {
    try {
        const result = await db.query('SELECT * FROM Products ORDER BY Name ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd getAllProducts:', error);
        res.status(500).json({ error: 'Błąd pobierania produktów' });
    }
}

async function createProduct(req, res) {
    const { name, price, stock } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO Products (Name, Price, Stock) VALUES ($1, $2, $3) RETURNING ID',
            [name, price, stock]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Produkt dodany.' });
    } catch (error) {
        res.status(500).json({ error: 'Błąd tworzenia produktu.' });
    }
}

async function deleteProduct(req, res) {
    const productId = req.params.id;
    try {
        await db.query('DELETE FROM Products WHERE ID = $1', [productId]);
        res.status(200).json({ message: 'Produkt usunięty.' });
    } catch (error) {
        if (error.message && error.message.includes('aktywnych zamówień')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Produkt występuje w zamówieniach.\n Brak możliwości usunięcia.' });
    }
}

async function updateStock(req, res) {
    const { stock } = req.body;
    try {
        await db.query('UPDATE Products SET Stock = $1 WHERE ID = $2', [stock, req.params.id]);
        res.status(200).json({ message: 'Stan zaktualizowany.' });
    } catch (error) {
        res.status(500).json({ error: 'Błąd aktualizacji stanu.' });
    }
}

async function updatePrice(req, res) {
    const { price } = req.body;
    try {
        await db.query('UPDATE Products SET Price = $1 WHERE ID = $2', [price, req.params.id]);
        res.status(200).json({ message: 'Cena zaktualizowana.' });
    } catch (error) {
        res.status(500).json({ error: 'Błąd aktualizacji ceny.' });
    }
}

module.exports = {
    getAllProducts,
    createProduct,
    deleteProduct,
    updateStock,
    updatePrice
};