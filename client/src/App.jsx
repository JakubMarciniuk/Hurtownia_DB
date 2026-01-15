import { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('products');
    const [cart, setCart] = useState([]);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        // This forces the browser tab name to change
        document.title = "Hurtownia";
    }, []);

    // --- POWIADOMIENIA ---
    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // --- LOGOWANIE ---
    const handleLogin = async (username, password) => {
        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok) {
                setUser({ id: data.userId, role: data.role, username });
                notify(`Witaj, ${username}!`);
                setView('products');
            } else {
                notify(data.error || 'Błąd logowania', 'error');
            }
        } catch (err) {
            notify('Błąd połączenia z serwerem.', 'error');
        }
    };

    // --- OBSŁUGA KOSZYKA ---
    const addToCart = (product) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === product.id);
            if (existing) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        notify(`Dodano do koszyka: ${product.name}`);
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    // --- ZŁOŻENIE ZAMÓWIENIA ---
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const orderItems = cart.map(item => ({
            productId: item.id,
            quantity: item.quantity
        }));

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user.id
                },
                body: JSON.stringify({ userId: user.id, items: orderItems })
            });

            const data = await res.json();

            if (res.ok) {
                notify(`Zamówienie #${data.orderId} zostało złożone pomyślnie!`, 'success');
                clearCart();
                setView('products');
            } else {
                notify(data.error || 'Błąd składania zamówienia', 'error');
            }
        } catch (err) {
            notify('Błąd połączenia', 'error');
        }
    };

    // --- RENDEROWANIE ---
    if (!user) {
        return (
            <div className="login-page">
                <LoginForm onLogin={handleLogin} />
                {notification && <Toast msg={notification.msg} type={notification.type} />}
            </div>
        );
    }

    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // NOWE: Helper do sprawdzania uprawnień (Kierownik lub Admin)
    const isManagerOrAdmin = user.role === 'Administrator' || user.role === 'Kierownik Sklepu';

    return (
        <div className="app-wrapper">
            <header>
                <div className="header-content">
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2563eb' }}>
                        📦 Hurtownia
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                            <div style={{ color: '#6b7280' }}>{user.role}</div>
                        </div>
                        <button className="secondary" onClick={() => setUser(null)}>Wyloguj</button>
                    </div>
                </div>
            </header>

            <div className="main-container">
                <nav>
                    <button className={`nav-btn ${view === 'products' ? 'active' : ''}`} onClick={() => setView('products')}>
                        Produkty
                    </button>

                    <button className={`nav-btn ${view === 'cart' ? 'active' : ''}`} onClick={() => setView('cart')}>
                        🛒 Koszyk
                        {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                    </button>

                    {user.role === 'Klient' && (
                        <button className={`nav-btn ${view === 'client' ? 'active' : ''}`} onClick={() => setView('client')}>
                            Moje Konto
                        </button>
                    )}

                    {/* ZMIANA: Kierownik i Admin widzą te same przyciski operacyjne */}
                    {isManagerOrAdmin && (
                        <>
                            <button className={`nav-btn ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}>
                                Raporty
                            </button>
                            <button className={`nav-btn ${view === 'admin-orders' ? 'active' : ''}`} onClick={() => setView('admin-orders')}>
                                📑 Zamówienia
                            </button>
                        </>
                    )}

                    {/* ZMIANA: Tylko Admin widzi produkty i NOWEGO Użytkownika */}
                    {user.role === 'Administrator' && (
                        <>
                            <button className={`nav-btn ${view === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}>
                                ⚙️ Produkty
                            </button>
                            <button className={`nav-btn ${view === 'users-mgmt' ? 'active' : ''}`} onClick={() => setView('users-mgmt')}>
                                👥 Użytkownicy
                            </button>
                        </>
                    )}
                </nav>

                <main>
                    {view === 'products' && <ProductsView addToCart={addToCart} notify={notify} />}

                    {view === 'cart' && (
                        <CartView
                            cart={cart}
                            removeFromCart={removeFromCart}
                            onCheckout={handleCheckout}
                        />
                    )}

                    {view === 'reports' && <ReportsView user={user} />}

                    {view === 'admin-orders' && <AdminOrdersView user={user} notify={notify} />}

                    {view === 'admin' && <AdminView user={user} notify={notify} />}
                    {view === 'client' && <ClientView user={user} notify={notify} />}

                    {/* NOWY WIDOK */}
                    {view === 'users-mgmt' && <UsersManagementView user={user} notify={notify} />}
                </main>
            </div>

            {notification && <Toast msg={notification.msg} type={notification.type} />}
        </div>
    );
}

// --- KOMPONENTY ---

const LoginForm = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if(username && password) onLogin(username, password); };

    return (
        <div className="login-card">
            <h2>🔐 Logowanie</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Login</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="input-group">
                    <label>Hasło</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" style={{width:'100%'}}>Zaloguj</button>
            </form>
        </div>
    );
};

const ProductsView = ({ addToCart, notify }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => notify('Błąd sieci', 'error'));
    }, []);

    return (
        <div className="card">
            <h3>📦 Oferta produktów</h3>
            <table>
                <thead><tr><th>Nazwa</th><th>Cena</th><th>Stan</th><th>Akcja</th></tr></thead>
                <tbody>
                {products.map(p => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{parseFloat(p.price).toFixed(2)} zł</td>
                        <td>{p.stock > 0 ? p.stock : <span style={{color:'red'}}>Brak</span>}</td>
                        <td>
                            <button disabled={p.stock <= 0} onClick={() => addToCart(p)}>
                                + Do koszyka
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

const CartView = ({ cart, removeFromCart, onCheckout }) => {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (cart.length === 0) {
        return (
            <div className="card">
                <h3>🛒 Twój koszyk</h3>
                <p style={{padding:'20px', textAlign:'center', color:'#6b7280'}}>Koszyk jest pusty.</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>🛒 Twój koszyk</h3>
            <table>
                <thead><tr><th>Nazwa</th><th>Cena</th><th>Ilość</th><th>Suma</th><th>Akcja</th></tr></thead>
                <tbody>
                {cart.map(item => (
                    <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{parseFloat(item.price).toFixed(2)} zł</td>
                        <td>{item.quantity} szt.</td>
                        <td>{(item.price * item.quantity).toFixed(2)} zł</td>
                        <td>
                            <button className="danger" onClick={() => removeFromCart(item.id)}>Usuń</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="cart-summary">
                <span>Łącznie do zapłaty:</span>
                <span className="total-price">{total.toFixed(2)} PLN</span>
                <button className="checkout-btn" onClick={onCheckout}>
                    ✅ Złóż zamówienie
                </button>
            </div>
        </div>
    );
};

// --- ZMODYFIKOWANY KOMPONENT: ZARZĄDZANIE UŻYTKOWNIKAMI (BEZ KOLUMNY HASŁA) ---
const UsersManagementView = ({ user, notify }) => {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ username: '', password: '', role: 'Klient' });

    // Stany do edycji
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ username: '', role: '', newPassword: '' });

    const ROLES = ['Klient', 'Kierownik Sklepu', 'Administrator'];

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/users', { headers: { 'X-User-ID': user.id } });
            if (res.ok) setUsers(await res.json());
        } catch (e) { notify('Błąd sieci', 'error'); }
    };

    useEffect(() => { loadUsers(); }, []);

    // Dodawanie
    const handleAdd = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
            body: JSON.stringify(form)
        });
        if (res.ok) { notify('Użytkownik dodany'); setForm({ username: '', password: '', role: 'Klient' }); loadUsers(); }
        else { const d = await res.json(); notify(d.error || d.message, 'error'); }
    };

    // Usuwanie
    const handleDelete = async (id) => {
        if (!confirm('Usunąć użytkownika?')) return;
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'X-User-ID': user.id } });
        if (res.ok) { notify('Usunięto'); loadUsers(); }
        else { const d = await res.json(); notify(d.error || d.message, 'error'); }
    };

    // Start edycji
    const startEditing = (u) => {
        setEditingId(u.id);
        setEditData({ username: u.username, role: u.role, newPassword: '' });
    };

    // Zapis
    const saveEdit = async (id) => {
        const body = { username: editData.username, role: editData.role };
        if (editData.newPassword && editData.newPassword.trim() !== "") {
            body.password = editData.newPassword;
        }

        const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
            body: JSON.stringify(body)
        });

        if (res.ok) { notify('Zaktualizowano'); setEditingId(null); loadUsers(); }
        else notify('Błąd edycji', 'error');
    };

    return (
        <div className="card">
            <h3>👥 Zarządzanie użytkownikami</h3>

            {/* FORMULARZ DODAWANIA */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
                <h4>➕ Dodaj użytkownika</h4>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap:'wrap' }}>
                    <div style={{flex:1}}> <label>Login</label> <input value={form.username} onChange={e => setForm({...form, username:e.target.value})} required /> </div>
                    <div style={{flex:1}}> <label>Hasło</label> <input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} required /> </div>
                    <div style={{flex:1}}> <label>Rola</label> <select value={form.role} onChange={e => setForm({...form, role:e.target.value})}> {ROLES.map(r => <option key={r} value={r}>{r}</option>)} </select> </div>
                    <button type="submit">Dodaj</button>
                </form>
            </div>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    {/* Zmieniamy nagłówek, bo tu będzie i login i hasło przy edycji */}
                    <th>Login / (Hasło przy edycji)</th>
                    <th>Rola</th>
                    <th>Akcja</th>
                </tr>
                </thead>
                <tbody>
                {users.map(u => {
                    const isEditing = editingId === u.id;

                    return (
                        <tr key={u.id} style={{ background: isEditing ? '#eff6ff' : 'transparent' }}>
                            <td>{u.id}</td>

                            {/* KOLUMNA LOGIN (I HASŁO W TRYBIE EDYCJI) */}
                            <td>
                                {isEditing ? (
                                    <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                        {/* Edycja Loginu */}
                                        <input
                                            value={editData.username}
                                            onChange={e => setEditData({...editData, username: e.target.value})}
                                            placeholder="Login"
                                            style={{padding: '5px'}}
                                        />
                                        {/* Edycja Hasła (Tylko tutaj się pojawia) */}
                                        <input
                                            type="password"
                                            placeholder="Nowe hasło (opcjonalne)"
                                            value={editData.newPassword}
                                            onChange={e => setEditData({...editData, newPassword: e.target.value})}
                                            style={{padding: '5px', border:'1px solid #93c5fd'}}
                                        />
                                    </div>
                                ) : (
                                    <strong>{u.username}</strong>
                                )}
                            </td>

                            {/* KOLUMNA ROLA */}
                            <td>
                                {isEditing ? (
                                    <select
                                        value={editData.role}
                                        onChange={e => setEditData({...editData, role: e.target.value})}
                                        style={{padding: '5px'}}
                                    >
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                ) : (
                                    <span style={{
                                        padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem',
                                        backgroundColor: u.role==='Administrator'?'#fee2e2':u.role==='Kierownik Sklepu'?'#fef3c7':'#dbeafe',
                                        color: '#374151'
                                    }}>
                                            {u.role}
                                        </span>
                                )}
                            </td>

                            {/* KOLUMNA AKCJA */}
                            <td>
                                {isEditing ? (
                                    <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                        <button onClick={() => saveEdit(u.id)} style={{background:'#16a34a', padding:'5px 10px', fontSize:'0.8rem'}}>
                                            💾 Zapisz
                                        </button>
                                        <button className="secondary" onClick={() => setEditingId(null)} style={{padding:'5px 10px', fontSize:'0.8rem'}}>
                                            ❌ Anuluj
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{display:'flex', gap:'5px'}}>
                                        <button className="secondary" onClick={() => startEditing(u)} style={{padding:'5px 10px', fontSize:'0.8rem'}}>
                                            ✏️ Edytuj
                                        </button>
                                        <button className="danger" onClick={() => handleDelete(u.id)} style={{padding:'5px 10px', fontSize:'0.8rem'}}>
                                            🗑️
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

const AdminOrdersView = ({ user, notify }) => {
    const [orders, setOrders] = useState([]);
    const [editingOrderId, setEditingOrderId] = useState(null); // ID edytowanego zamówienia

    const loadOrders = async () => {
        try {
            const res = await fetch('/api/orders/all', { headers: { 'X-User-ID': user.id } });
            if (res.ok) setOrders(await res.json());
            else notify('Błąd pobierania zamówień', 'error');
        } catch (err) { notify('Błąd sieci', 'error'); }
    };

    useEffect(() => { loadOrders(); }, []);

    return (
        <div className="card">
            <h3>📑 Zarządzanie zamówieniami</h3>
            <table>
                <thead>
                <tr>
                    <th>ID</th><th>Klient</th><th>Data</th><th>Kwota</th><th>Status</th><th>Akcja</th>
                </tr>
                </thead>
                <tbody>
                {orders.map(order => (
                    <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td><strong>{order.username}</strong></td>
                        <td>{new Date(order.date).toLocaleString()}</td>
                        <td>{parseFloat(order.total_price).toFixed(2)} zł</td>
                        <td>
                            <span style={{
                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem',
                                backgroundColor: order.status === 'NOWE' ? '#dbeafe' : order.status === 'ZREALIZOWANE' ? '#dcfce7' : '#f3f4f6',
                                color: order.status === 'NOWE' ? '#1e40af' : order.status === 'ZREALIZOWANE' ? '#166534' : '#374151'
                            }}>
                                {order.status}
                            </span>
                        </td>
                        <td>
                            {/* PRZYCISK ZAMIAST SELECTA */}
                            <button onClick={() => setEditingOrderId(order.id)}>
                                🛠️ Edytuj
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* MODAL EDYCJI (Wyświetla się, gdy wybrano zamówienie) */}
            {editingOrderId && (
                <OrderEditModal
                    orderId={editingOrderId}
                    user={user}
                    onClose={() => { setEditingOrderId(null); loadOrders(); }}
                    notify={notify}
                />
            )}
        </div>
    );
};

// --- KOMPONENT: MODAL EDYCJI ZAMÓWIENIA ---
const OrderEditModal = ({ orderId, user, onClose, notify }) => {
    const [details, setDetails] = useState(null);
    const [allProducts, setAllProducts] = useState([]); // Produkty do listy wyboru
    const [newProduct, setNewProduct] = useState({ id: '', quantity: 1 });
    const STATUSES = ['NOWE', 'W TRAKCIE REALIZACJI', 'WYSŁANE', 'ZREALIZOWANE', 'ANULOWANE'];

    // Pobranie danych zamówienia i listy produktów
    const fetchData = async () => {
        try {
            const [resOrder, resProds] = await Promise.all([
                fetch(`/api/orders/${orderId}`, { headers: { 'X-User-ID': user.id } }),
                fetch('/api/products')
            ]);

            if(resOrder.ok && resProds.ok) {
                const dataOrder = await resOrder.json();
                const dataProds = await resProds.json();
                setDetails(dataOrder);
                setAllProducts(dataProds);
            } else {
                notify('Błąd pobierania szczegółów', 'error');
                onClose();
            }
        } catch(e) { notify('Błąd sieci', 'error'); }
    };

    useEffect(() => { fetchData(); }, [orderId]);

    // Zmiana statusu
    const handleStatusChange = async (newStatus) => {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
            body: JSON.stringify({ newStatus })
        });
        if(res.ok) { notify('Status zmieniony'); fetchData(); }
        else { const d = await res.json(); notify(d.message, 'error'); }
    };

    // Usunięcie produktu
    const handleRemoveItem = async (productId) => {
        if(!confirm("Usunąć produkt z zamówienia?")) return;
        const res = await fetch(`/api/orders/${orderId}/items/${productId}`, {
            method: 'DELETE', headers: { 'X-User-ID': user.id }
        });
        if(res.ok) { notify('Produkt usunięty'); fetchData(); }
        else { const d = await res.json(); notify(d.error, 'error'); }
    };

    // Dodanie produktu
    const handleAddItem = async (e) => {
        e.preventDefault();
        if(!newProduct.id) return;

        const res = await fetch(`/api/orders/${orderId}/items/${newProduct.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
            body: JSON.stringify({ quantity: Number(newProduct.quantity) })
        });

        if(res.ok) {
            notify('Produkt dodany/zaktualizowany');
            fetchData();
            setNewProduct({ id: '', quantity: 1 });
        } else {
            const d = await res.json(); notify(d.error || d.message, 'error');
        }
    };

    if (!details) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h2>Edycja zamówienia #{details.order.id}</h2>
                    <button className="secondary" onClick={onClose}>Zamknij</button>
                </div>

                {/* 1. SEKCJA STATUSU */}
                <div style={{background:'#f3f4f6', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}>
                    <label><strong>Status:</strong></label>
                    <select
                        value={details.order.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        style={{width:'100%', marginTop:'5px', padding:'8px'}}
                    >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* 2. SEKCJA POZYCJI */}
                <h4>Pozycje w zamówieniu:</h4>
                <table style={{marginBottom:'20px'}}>
                    <thead><tr><th>Produkt</th><th>Cena</th><th>Ilość</th><th>Opcje</th></tr></thead>
                    <tbody>
                    {details.items.map(item => (
                        <tr key={item.productid}>
                            <td>{item.name}</td>
                            <td>{parseFloat(item.unitprice).toFixed(2)} zł</td>
                            <td>{item.quantity}</td>
                            <td>
                                <button className="danger" onClick={() => handleRemoveItem(item.productid)} style={{fontSize:'0.8rem', padding:'5px 10px'}}>
                                    Usuń
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* 3. SEKCJA DODAWANIA */}
                <div style={{borderTop:'1px solid #eee', paddingTop:'15px'}}>
                    <h4>➕ Dodaj / Zaktualizuj produkt</h4>
                    <form onSubmit={handleAddItem} style={{display:'flex', gap:'10px'}}>
                        <select
                            value={newProduct.id}
                            onChange={e => setNewProduct({...newProduct, id: e.target.value})}
                            style={{flex:2, padding:'8px'}}
                            required
                        >
                            <option value="">-- Wybierz produkt --</option>
                            {allProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Dostępne: {p.stock})</option>
                            ))}
                        </select>
                        <input
                            type="number" min="1"
                            value={newProduct.quantity}
                            onChange={e => setNewProduct({...newProduct, quantity: e.target.value})}
                            style={{flex:1, padding:'8px'}}
                        />
                        <button type="submit">Dodaj</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ReportsView = ({ user }) => {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch('/api/reports/low-stock', { headers: { 'X-User-ID': user.id } })
            .then(r => r.json()).then(setData);
    }, [user.id]);

    return (
        <div className="card">
            <h3>📊 Niskie stany magazynowe</h3>
            {data.length === 0 ? <p>Stany magazynowe OK.</p> : (
                <table>
                    <thead><tr><th>Produkt</th><th>Stan</th></tr></thead>
                    <tbody>{data.map(p => <tr key={p.id}><td>{p.name}</td><td style={{color:'red'}}>{p.stock}</td></tr>)}</tbody>
                </table>
            )}
        </div>
    );
};

const AdminView = ({ user, notify }) => {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ name: '', price: '', stock: '' });

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ price: '', stock: '' });

    const loadData = async () => {
        try {
            const res = await fetch('/api/products');
            setProducts(await res.json());
        } catch(e) { notify('Błąd pobierania danych', 'error'); }
    };

    useEffect(() => { loadData(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
            body: JSON.stringify(form)
        });
        if(res.ok) { notify('Produkt dodany'); setForm({ name: '', price: '', stock: '' }); loadData(); }
        else { notify('Błąd dodawania', 'error'); }
    };

    const handleDelete = async (id) => {
        if(!confirm('Usunąć produkt?')) return;
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE', headers: { 'X-User-ID': user.id }
        });
        if(res.ok) { notify('Produkt usunięty'); loadData(); }
        else {
            const data = await res.json();
            notify(data.error || 'Produkt występuje w zamówieniach. Brak możliwości usunięcia.', 'error');
        }
    };

    const startEditing = (product) => {
        setEditingId(product.id);
        setEditData({
            price: product.price || product.Price,
            stock: product.stock || product.Stock
        });
    };

    // ZAPISYWANIE PRZEZ PUT (Tak jak ustalone wcześniej)
    const saveEdit = async (id) => {
        try {
            console.log(`Zapisywanie (PUT) dla ID: ${id}...`);

            const reqPrice = fetch(`/api/products/${id}/price`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
                body: JSON.stringify({ price: editData.price })
            });

            const reqStock = fetch(`/api/products/${id}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
                body: JSON.stringify({ stock: editData.stock })
            });

            const [resPrice, resStock] = await Promise.all([reqPrice, reqStock]);

            if (resPrice.ok && resStock.ok) {
                notify('Zaktualizowano pomyślnie!');
                setEditingId(null);
                loadData();
            } else {
                notify('Błąd aktualizacji (sprawdź konsolę)', 'error');
            }
        } catch (error) {
            console.error('Błąd sieci:', error);
            notify('Błąd połączenia z serwerem', 'error');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    return (
        <div className="card">
            <h3>⚙️ Zarządzanie produktami</h3>

            <div style={{marginBottom:'20px', padding:'15px', background:'#f8fafc', border:'1px solid #eee', borderRadius:'8px'}}>
                <h4>Dodaj produkt</h4>
                <form onSubmit={handleAdd} style={{display:'flex', gap:'10px', alignItems:'flex-end'}}>
                    <input placeholder="Nazwa" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
                    <input type="number" step="0.01" placeholder="Cena" value={form.price} onChange={e => setForm({...form, price:e.target.value})} required />
                    <input type="number" placeholder="Ilość" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})} required />
                    <button type="submit">Dodaj</button>
                </form>
            </div>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Nazwa</th>
                    <th>Cena</th>
                    <th>Stan</th>
                    <th>Akcja</th>
                </tr>
                </thead>
                <tbody>
                {products.map(p => {
                    const isEditing = editingId === p.id;
                    const priceVal = p.price || p.Price;
                    const stockVal = p.stock || p.Stock;

                    return (
                        <tr key={p.id} style={{background: isEditing ? '#eff6ff' : 'transparent'}}>
                            <td>{p.id}</td>
                            <td><strong>{p.name}</strong></td>
                            <td>
                                {isEditing ? (
                                    <input
                                        type="number" step="0.01"
                                        value={editData.price}
                                        onChange={e => setEditData({...editData, price: e.target.value})}
                                        style={{width:'80px', padding:'5px', margin:0}}
                                    />
                                ) : `${parseFloat(priceVal).toFixed(2)} zł`}
                            </td>
                            <td>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editData.stock}
                                        onChange={e => setEditData({...editData, stock: e.target.value})}
                                        style={{width:'60px', padding:'5px', margin:0}}
                                    />
                                ) : stockVal}
                            </td>
                            <td>
                                {isEditing ? (
                                    <div style={{display:'flex', gap:'5px'}}>
                                        <button onClick={() => saveEdit(p.id)} style={{background:'#16a34a', padding:'5px 10px', fontSize:'0.8rem'}}>
                                            💾 Zapisz
                                        </button>
                                        <button className="secondary" onClick={cancelEdit} style={{padding:'5px 10px', fontSize:'0.8rem'}}>
                                            ❌
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{display:'flex', gap:'5px'}}>
                                        <button className="secondary" onClick={() => startEditing(p)} style={{padding:'5px 10px', fontSize:'0.8rem'}}>
                                            ✏️ Edytuj
                                        </button>
                                        <button className="danger" onClick={() => handleDelete(p.id)} style={{padding:'5px 10px', fontSize:'0.8rem'}}>
                                            🗑️ Usuń
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

const ClientView = ({ user, notify }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stan dla szczegółów zamówienia (do Modala)
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

    // 1. Pobieranie historii (lista ogólna)
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/reports/history/${user.id}`, {
                    headers: { 'X-User-ID': user.id }
                });
                if (res.ok) setHistory(await res.json());
                else if (res.status !== 404) notify('Błąd historii', 'error');
            } catch (err) { notify('Błąd sieci', 'error'); }
            finally { setLoading(false); }
        };
        fetchHistory();
    }, [user.id]);

    // 2. Pobieranie szczegółów konkretnego zamówienia
    const handleShowDetails = async (orderId) => {
        try {
            const res = await fetch(`/api/reports/order-details/${orderId}`, {
                headers: { 'X-User-ID': user.id }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend zwraca płaską listę wierszy, np: [{id:1, name:'Mleko', ...}, {id:1, name:'Chleb'}]
                setSelectedOrderDetails(data);
            } else {
                notify('Nie udało się pobrać szczegółów', 'error');
            }
        } catch (err) { notify('Błąd sieci', 'error'); }
    };

    // Zmiana hasła
    const handleChangePass = async () => {
        const newPass = prompt("Podaj nowe hasło:");
        if(!newPass) return;
        const res = await fetch(`/api/users/reset-password/${user.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: newPass })
        });
        if(res.ok) notify('Hasło zmienione pomyślnie!');
        else notify('Błąd zmiany hasła', 'error');
    };

    return (
        <div className="card">
            <h3>👤 Moje Konto</h3>

            <div style={{padding:'20px', background:'#f9fafb', borderRadius:'8px', marginBottom:'30px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <p style={{margin:'5px 0'}}>Użytkownik: <strong>{user.username}</strong></p>
                    <p style={{margin:'5px 0', color:'#6b7280'}}>ID: #{user.id}</p>
                </div>
                <button onClick={handleChangePass} className="secondary">🔐 Zmień hasło</button>
            </div>

            <h3>📜 Historia zamówień</h3>

            {loading ? <p>Ładowanie...</p> : history.length === 0 ? <p>Brak zamówień.</p> : (
                <table>
                    <thead>
                    <tr>
                        <th>Nr</th><th>Data</th><th>Wartość</th><th>Akcja</th>
                    </tr>
                    </thead>
                    <tbody>
                    {history.map(order => (
                        <tr key={order.order_id}>
                            <td>#{order.order_id}</td>
                            <td>{new Date(order.date).toLocaleDateString()}</td>
                            <td><strong>{parseFloat(order.total_order_value).toFixed(2)} zł</strong></td>
                            <td>
                                <button onClick={() => handleShowDetails(order.order_id)} style={{fontSize:'0.8rem', padding:'5px 10px'}}>
                                    👁️ Szczegóły
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* --- MODAL SZCZEGÓŁÓW --- */}
            {selectedOrderDetails && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            {/* Bierzemy dane nagłówkowe z pierwszego elementu listy */}
                            <h2>Szczegóły zamówienia #{selectedOrderDetails[0]?.id}</h2>
                            <button className="secondary" onClick={() => setSelectedOrderDetails(null)}>Zamknij</button>
                        </div>

                        <div style={{marginBottom:'20px', padding:'10px', background:'#f3f4f6', borderRadius:'8px'}}>
                            <p><strong>Status:</strong> {selectedOrderDetails[0]?.status}</p>
                            <p><strong>Data:</strong> {new Date(selectedOrderDetails[0]?.date).toLocaleString()}</p>
                        </div>

                        <table>
                            <thead><tr><th>Produkt</th><th>Ilość</th><th>Cena jedn.</th><th>Suma</th></tr></thead>
                            <tbody>
                            {selectedOrderDetails.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.quantity} szt.</td>
                                    <td>{parseFloat(item.unitprice).toFixed(2)} zł</td>
                                    <td>{(item.quantity * item.unitprice).toFixed(2)} zł</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

const Toast = ({ msg, type }) => <div className="toast" style={{backgroundColor:type==='success'?'#22c55e':'#ef4444'}}>{msg}</div>;

export default App;