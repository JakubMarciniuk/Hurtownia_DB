// controllers/reportsController.js
const db = require('../config/db');

/**
 * Zapytanie 1: Generuje raport historii zamówień klienta wraz z kumulatywną wartością (Funkcje Okienkowe).
 */
async function getClientOrderHistory(req, res) {
    const userId = req.params.id;

    const sqlQuery = `
        SELECT
            O.ID AS order_id,
            O.Date,
            SUM(OP.Quantity * OP.UnitPrice) AS total_order_value,

            SUM(SUM(OP.Quantity * OP.UnitPrice)) OVER (
                PARTITION BY O.UserID 
                ORDER BY O.Date ASC, O.ID ASC
                ROWS UNBOUNDED PRECEDING
            ) AS cumulative_value

        FROM
            Orders O
                JOIN
            OrderProduct OP ON O.ID = OP.OrderID
        WHERE
            O.UserID = $1
        GROUP BY
            O.ID, O.Date, O.UserID
        ORDER BY
            O.Date ASC, O.ID ASC;
    `;

    try {
        const result = await db.query(sqlQuery, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Klient nie znaleziony lub nie ma żadnych zamówień.' });
        }

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Błąd raportowania (Kumulatywna Wartość):', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera podczas generowania raportu.' });
    }
}

/**
 * Zapytanie 2: Produkty z niskim stanem magazynowym (Stock <= 5)
 */
async function getLowStockProducts(req, res) {
    const sqlQuery = `
        SELECT ID, Name, Price, Stock
        FROM Products
        WHERE Stock <= 5
        ORDER BY Stock ASC;
    `;
    try {
        const result = await db.query(sqlQuery);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd raportowania (Niski Stock):', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
}

/**
 * Zapytanie 3: Wyświetlenie szczegółów zamówienia z produktami
 */
async function getOrderDetails(req, res) {
    const orderId = req.params.id;
    const sqlQuery = `
        SELECT o.ID, o.Date, o.Status, p.Name, op.Quantity, op.UnitPrice
        FROM Orders o
        JOIN OrderProduct op ON op.OrderID = o.ID
        JOIN Products p ON p.ID = op.ProductID
        WHERE o.ID = $1;
    `;
    try {
        const result = await db.query(sqlQuery, [orderId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Zamówienie nie znalezione.' });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd raportowania (Szczegóły Zamówienia):', error.message);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
}

module.exports = {
    getClientOrderHistory,
    getLowStockProducts,
    getOrderDetails,
};