const API_URL = '/api';
let currentUser = { id: null, role: null };

// --- 1. SYSTEM POWIADOMIEŃ (UX) ---
function notify(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.backgroundColor = type === 'success' ? '#16a34a' : '#dc2626';
    toast.style.display = 'block';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// --- 2. OBSŁUGA LOGOWANIA ---
async function handleLogin() {
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

    if (!username || !password) {
        notify('Wpisz login i hasło!', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            currentUser = { id: data.userId, role: data.role };
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            renderUI();
            notify(`Zalogowano pomyślnie jako ${currentUser.role}`);
        } else {
            notify(data.error || 'Błąd logowania', 'error');
        }
    } catch (err) {
        notify('Błąd połączenia z serwerem', 'error');
    }
}

// --- 3. DYNAMICZNY INTERFEJS (RBAC) ---
function renderUI() {
    const nav = document.getElementById('nav-bar');
    document.getElementById('display-role').innerText = currentUser.role;
    document.getElementById('display-id').innerText = currentUser.id;

    // Budowanie menu na podstawie klasy użytkownika
    let menu = `<button onclick="showProducts()">📦 Produkty</button>`;

    if (currentUser.role === 'Klient') {
        menu += `<button onclick="showClientOrders()">📋 Moje Zamówienia</button>`;
    }

    if (currentUser.role === 'Kierownik Sklepu' || currentUser.role === 'Administrator') {
        menu += `<button onclick="showReports()">📊 Raporty</button>`;
    }

    if (currentUser.role === 'Administrator') {
        menu += `<button onclick="showAdminPanel()">⚙️ Zarządzanie</button>`;
    }

    nav.innerHTML = menu;
    showProducts(); // Domyślny widok po zalogowaniu
}

// --- 4. WIDOK: PRODUKTY (DLA WSZYSTKICH) ---
async function showProducts() {
    const main = document.getElementById('app-content');
    main.innerHTML = '<div class="card">Ładowanie produktów...</div>';

    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();

    main.innerHTML = `
        <div class="card">
            <h2>📦 Oferta Hurtowni</h2>
            <table>
                <thead>
                    <tr><th>Nazwa</th><th>Cena</th><th>Stan</th><th>Akcja</th></tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.price} zł</td>
                            <td>${p.stock > 0 ? p.stock + ' szt.' : '<span style="color:red">Brak</span>'}</td>
                            <td>
                                <button ${p.stock <= 0 ? 'disabled style="background:gray"' : ''} 
                                        onclick="buyProduct(${p.id})">
                                    🛒 Zamów 1 szt.
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

// --- 5. TRANSAKCJA T1: SKŁADANIE ZAMÓWIENIA ---
async function buyProduct(productId) {
    const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-ID': currentUser.id
        },
        body: JSON.stringify({
            userId: currentUser.id,
            items: [{ productId, quantity: 1 }]
        })
    });

    const data = await res.json();
    if (res.ok) {
        notify(`Zamówienie #${data.orderId} zostało złożone! (T1)`);
        showProducts();
    } else {
        notify(data.error || 'Błąd transakcji', 'error');
    }
}

// --- 6. WIDOK: RAPORTY (KIEROWNIK / ADMIN) ---
async function showReports() {
    const main = document.getElementById('app-content');
    main.innerHTML = `
        <div class="card">
            <h2>📊 Raporty Menedżerskie</h2>
            <div id="report-results">Pobieranie danych...</div>
        </div>`;

    const res = await fetch(`${API_URL}/reports/low-stock`, {
        headers: { 'X-User-ID': currentUser.id }
    });
    const data = await res.json();

    if (!res.ok) {
        document.getElementById('report-results').innerHTML = `<p style="color:red">${data.message}</p>`;
        return;
    }

    document.getElementById('report-results').innerHTML = `
        <h3>Produkty z niskim stanem (T2: Stock <= 5)</h3>
        <ul>
            ${data.map(p => `<li>${p.name} - Pozostało: <b>${p.stock}</b> szt.</li>`).join('')}
        </ul>
    `;
}

// --- 7. WIDOK: ZARZĄDZANIE (ADMIN ONLY - NF01, T2) ---
function showAdminPanel() {
    const main = document.getElementById('app-content');
    main.innerHTML = `
        <div class="card">
            <h2>⚙️ Zarządzanie Bazą Produktów (Admin)</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="renderNewProductForm()">➕ Dodaj Nowy Produkt</button>
            </div>
            <div id="admin-list">Ładowanie...</div>
        </div>`;
    loadAdminProducts();
}

async function loadAdminProducts() {
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();
    const container = document.getElementById('admin-list');

    container.innerHTML = `
        <table>
            <thead><tr><th>ID</th><th>Nazwa</th><th>Stan</th><th>Akcja</th></tr></thead>
            <tbody>
                ${products.map(p => `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.name}</td>
                        <td>${p.stock}</td>
                        <td>
                            <button class="secondary" style="background:#dc2626" onclick="deleteProduct(${p.id})">🗑️ Usuń</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

async function deleteProduct(id) {
    if (!confirm('Czy na pewno chcesz usunąć produkt? System sprawdzi regułę NF01.')) return;

    const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': currentUser.id }
    });

    const data = await res.json();
    if (res.ok) {
        notify('Produkt usunięty pomyślnie.');
        showAdminPanel();
    } else {
        // Wyświetlenie błędu z Triggera SQL (NF01)
        notify(data.error || data.message, 'error');
    }
}

function renderNewProductForm() {
    const main = document.getElementById('app-content');
    main.innerHTML = `
        <div class="card">
            <h2>Dodaj Produkt</h2>
            <input type="text" id="new-p-name" placeholder="Nazwa"><br><br>
            <input type="number" id="new-p-price" placeholder="Cena"><br><br>
            <input type="number" id="new-p-stock" placeholder="Stock"><br><br>
            <button onclick="saveProduct()">Zapisz</button>
            <button class="secondary" onclick="showAdminPanel()">Wróć</button>
        </div>`;
}

async function saveProduct() {
    const name = document.getElementById('new-p-name').value;
    const price = document.getElementById('new-p-price').value;
    const stock = document.getElementById('new-p-stock').value;

    const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-ID': currentUser.id
        },
        body: JSON.stringify({ name, price, stock })
    });

    if (res.ok) {
        notify('Dodano produkt!');
        showAdminPanel();
    } else {
        notify('Błąd dodawania', 'error');
    }
}

// --- 8. WIDOK: KLIENT (T3) ---
function showClientOrders() {
    const main = document.getElementById('app-content');
    main.innerHTML = `
        <div class="card">
            <h2>👤 Moje Konto</h2>
            <p>Możesz tutaj zmienić swoje hasło (Operacja T3).</p>
            <button onclick="resetMyPassword()">🔐 Zmień Hasło</button>
        </div>`;
}

async function resetMyPassword() {
    const newPass = prompt('Wpisz nowe hasło:');
    if (!newPass) return;

    const res = await fetch(`${API_URL}/users/reset-password/${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPass })
    });

    if (res.ok) {
        notify('Hasło zmienione! Zaloguj się ponownie przy następnej sesji.');
    } else {
        notify('Błąd zmiany hasła', 'error');
    }
}