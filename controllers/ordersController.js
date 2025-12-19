// controllers/ordersController.js
const db = require('../config/db');

// Lista statusów, które pozwalają na modyfikację zamówienia
const MODIFIABLE_STATUSES = ['NOWE', 'W TRAKCIE REALIZACJI'];

/**
 * T1: Atomowe tworzenie zamówienia i aktualizacja stanów magazynowych (UC.01).
 */
async function createOrder(req, res) {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Nieprawidłowe dane zamówienia (wymagane: userId, items[]).' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN'); // ROZPOCZĘCIE TRANSAKCJI

        // 1. Utwórz główne zamówienie
        const orderResult = await client.query(
            'INSERT INTO Orders (UserID, Status) VALUES ($1, $2) RETURNING ID',
            [userId, 'NOWE']
        );
        const orderId = orderResult.rows[0].id;

        // 2. Obsłuż pozycje i zaktualizuj Stock
        for (const item of items) {

            const productQuery = await client.query(
                'SELECT Price, Stock FROM Products WHERE ID = $1 FOR UPDATE',
                [item.productId]
            );

            if (productQuery.rows.length === 0) {
                throw new Error(`Produkt o ID ${item.productId} nie został znaleziony w bazie.`);
            }

            const product = productQuery.rows[0];

            // Walidacja dostępności (NF01)
            if (product.stock < item.quantity) {
                throw new Error(`Brak wystarczającej ilości (${item.quantity}) produktu ID ${item.productId}.`);
            }

            // Dodanie pozycji do OrderProduct z ceną historyczną (UnitPrice)
            await client.query(
                'INSERT INTO OrderProduct (OrderID, ProductID, Quantity, UnitPrice) VALUES ($1, $2, $3, $4)',
                [orderId, item.productId, item.quantity, product.price]
            );

            // Zmniejszenie Stock w Products
            await client.query(
                'UPDATE Products SET Stock = Stock - $1 WHERE ID = $2',
                [item.quantity, item.productId]
            );
        }

        await client.query('COMMIT'); // ZATWIERDŹ
        res.status(201).json({ orderId, message: 'Zamówienie złożone.' });

    } catch (error) {
        await client.query('ROLLBACK'); // WYCOFANIE TRANSAKCJI
        console.error('Błąd T1 (Zamówienie):', error.message);
        res.status(400).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
}

/**
 * Zmiana statusu zamówienia (np. Zrealizowane, Wysłane). Część T2.
 */
async function updateOrderStatus(req, res) {
    const orderId = req.params.id;
    const { newStatus } = req.body;

    const allowedStatuses = ['W TRAKCIE REALIZACJI', 'ZREALIZOWANE', 'WYSŁANE', 'ANULOWANE'];
    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ message: 'Nieprawidłowy status zamówienia. Dopuszczalne: ' + allowedStatuses.join(', ') });
    }

    try {
        const result = await db.query(
            'UPDATE Orders SET Status = $1 WHERE ID = $2 RETURNING ID',
            [newStatus, orderId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Zamówienie nie znalezione.' });
        }

        res.status(200).json({ orderId, message: `Status zamówienia ID ${orderId} zmieniony na: ${newStatus}` });

    } catch (error) {
        console.error('Błąd zmiany statusu zamówienia:', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
}

/**
 * Dodawanie produktu do istniejącego zamówienia (INSERT/UPDATE OrderProduct).
 * Wymaga transakcji: Sprawdzenie statusu -> Sprawdzenie Stock -> Aktualizacja OrderProduct -> Aktualizacja Products.
 */
async function addOrderItem(req, res) {
    const { orderId, productId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ message: 'Ilość musi być liczbą dodatnią.' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // KROK A: SPRAWDZENIE STATUSU ZAMÓWIENIA
        const orderStatusResult = await client.query(
            'SELECT Status FROM Orders WHERE ID = $1 FOR UPDATE', // Blokujemy wiersz zamówienia
            [orderId]
        );

        if (orderStatusResult.rows.length === 0) {
            throw new Error(`Zamówienie ID ${orderId} nie znalezione.`);
        }

        const currentStatus = orderStatusResult.rows[0].status;

        if (!MODIFIABLE_STATUSES.includes(currentStatus)) {
            throw new Error(`Nie można modyfikować zamówienia w statusie: ${currentStatus}. Modyfikacja dozwolona tylko dla statusów: ${MODIFIABLE_STATUSES.join(', ')}.`);
        }
        // KONIEC KROKU A

        // 1. Sprawdź Stock i pobierz cenę z blokadą wiersza
        const productQuery = await client.query(
            'SELECT Price, Stock FROM Products WHERE ID = $1 FOR UPDATE',
            [productId]
        );

        if (productQuery.rows.length === 0) {
            throw new Error(`Produkt ID ${productId} nie istnieje.`);
        }

        const product = productQuery.rows[0];

        // 2. Walidacja dostępności
        if (product.stock < quantity) {
            throw new Error(`Brak wystarczającej ilości (${quantity}) produktu ID ${productId}.`);
        }

        // 3. LOGIKA UPSERT: Dodanie lub Zaktualizowanie pozycji (ON CONFLICT)
        const upsertQuery = `
            INSERT INTO OrderProduct (OrderID, ProductID, Quantity, UnitPrice)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (OrderID, ProductID) 
            DO UPDATE SET 
                Quantity = OrderProduct.Quantity + EXCLUDED.Quantity;
        `;

        await client.query(
            upsertQuery,
            [orderId, productId, quantity, product.price]
        );

        // 4. Zmniejszenie Stock w Products
        await client.query(
            'UPDATE Products SET Stock = Stock - $1 WHERE ID = $2',
            [quantity, productId]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: `Dodano/zaktualizowano ${quantity} szt. produktu ID ${productId} w zamówieniu ID ${orderId}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Błąd dodawania/aktualizacji pozycji zamówienia:', error.message);
        res.status(400).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
}

/**
 * Usuwanie produktu z zamówienia (DELETE FROM OrderProduct).
 * Wymaga transakcji: Sprawdzenie statusu -> Usunięcie OrderProduct -> Zwiększenie Stock.
 */
async function removeOrderItem(req, res) {
    const { orderId, productId } = req.params;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // KROK A: SPRAWDZENIE STATUSU ZAMÓWIENIA
        const orderStatusResult = await client.query(
            'SELECT Status FROM Orders WHERE ID = $1 FOR UPDATE', // Blokujemy wiersz zamówienia
            [orderId]
        );

        if (orderStatusResult.rows.length === 0) {
            throw new Error(`Zamówienie ID ${orderId} nie znalezione.`);
        }

        const currentStatus = orderStatusResult.rows[0].status;

        if (!MODIFIABLE_STATUSES.includes(currentStatus)) {
            throw new Error(`Nie można modyfikować zamówienia w statusie: ${currentStatus}. Modyfikacja dozwolona tylko dla statusów: ${MODIFIABLE_STATUSES.join(', ')}.`);
        }
        // KONIEC KROKU A

        // 1. Pobierz dane o pozycji do usunięcia (potrzebna nam Quantity)
        const itemQuery = await client.query(
            'SELECT Quantity FROM OrderProduct WHERE OrderID = $1 AND ProductID = $2 FOR UPDATE',
            [orderId, productId]
        );

        if (itemQuery.rows.length === 0) {
            throw new Error('Pozycja zamówienia nie znaleziona.');
        }

        const quantity = itemQuery.rows[0].quantity;

        // 2. Usunięcie pozycji
        await client.query(
            'DELETE FROM OrderProduct WHERE OrderID = $1 AND ProductID = $2',
            [orderId, productId]
        );

        // 3. Zwiększenie Stock w Products (zwrot towaru na magazyn)
        await client.query(
            'UPDATE Products SET Stock = Stock + $1 WHERE ID = $2',
            [quantity, productId]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: `Usunięto produkt ID ${productId} z zamówienia ID ${orderId}. Zwrócono ${quantity} szt. na Stock.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Błąd usuwania pozycji zamówienia:', error.message);
        res.status(400).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
}

module.exports = {
    createOrder,
    updateOrderStatus,
    addOrderItem,
    removeOrderItem,
};