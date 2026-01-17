# 📦 System Zarządzania Hurtownią (Warehouse Management System)

Kompletna aplikacja typu Full-Stack do zarządzania hurtownią, zamówieniami i użytkownikami. System oferuje podział na role (Klient, Kierownik, Administrator) oraz zaawansowane funkcje takie jak edycja zamówień w czasie rzeczywistym, raporty zarządcze i dynamiczne zarządzanie stanem magazynowym.

Aplikacja implementuje architekturę klient-serwer, wykorzystując **REST API** do komunikacji.

---

## 🚀 Technologie

**Backend:**
* **Node.js** & **Express.js** - Logika serwerowa i routing.
* **PostgreSQL** - Relacyjna baza danych.
* **node-postgres (pg)** - Biblioteka do komunikacji z bazą.
* **JWT (JSON Web Token)** - Autoryzacja i zarządzanie sesją bezstanową.
* **Bcrypt** - Bezpieczne hashowanie haseł.

**Frontend:**
* **React.js (Vite)** - Interfejs użytkownika.
* **CSS3** - Responsywny i estetyczny design (Custom CSS).
* **Fetch API** - Komunikacja asynchroniczna z backendem.

---

## ✨ Funkcjonalności (Podział na role)

System wykorzystuje model **RBAC (Role-Based Access Control)**:

### 👤 Klient
* **Przegląd oferty:** Dostęp do listy produktów z aktualnymi cenami i stanami magazynowymi.
* **Koszyk zakupowy:** Dodawanie produktów, podgląd sumy, składanie zamówień (obsługa transakcji bazodanowych).
* **Historia zamówień:**
    * Wyświetlanie listy własnych zamówień.
    * **Analiza wydatków:** Wyświetlanie wartości narastającej (wykorzystanie funkcji okienkowych SQL `OVER (PARTITION BY ...)`).
* **Szczegóły zamówienia:** Modal z listą zakupionych produktów i cenami historycznymi.
* **Zarządzanie kontem:** Możliwość zmiany hasła.

### 👔 Kierownik Sklepu
* **Zarządzanie zamówieniami:**
    * Podgląd wszystkich zamówień w systemie.
    * Edycja statusów (np. `NOWE` -> `WYSŁANE`).
    * Edycja zawartości zamówienia (dodawanie/usuwanie pozycji z istniejących zamówień).
* **Raportowanie:**
    * Raport produktów o niskim stanie magazynowym (Low Stock Alert).

### 🛠️ Administrator
* **Pełne uprawnienia Kierownika.**
* **Zarządzanie Produktami (CRUD):**
    * Dodawanie nowych towarów.
    * **Inline Editing:** Szybka edycja ceny i stanu magazynowego bezpośrednio w tabeli.
    * Usuwanie produktów.
* **Zarządzanie Użytkownikami (CRUD):**
    * Tworzenie nowych kont (np. dla pracowników).
    * Edycja danych użytkowników (zmiana loginu, roli).
    * Resetowanie haseł użytkowników.
    * Usuwanie kont.

---

## ⚙️ Instalacja i Konfiguracja

### Wymagania
* Node.js (v16+)
* PostgreSQL
* npm (lub kompatybilne)

### 1. Konfiguracja Bazy Danych
Utwórz nową bazę danych w PostgreSQL i wykonaj poniższy skrypt SQL, aby utworzyć strukturę tabel:

```sql
-- Tabela Użytkowników
CREATE TABLE Users (
    ID SERIAL PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) DEFAULT 'Klient' CHECK (Role IN ('Klient', 'Kierownik Sklepu', 'Administrator'))
);

-- Tabela Produktów
CREATE TABLE Products (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) NOT NULL CHECK (Price >= 0),
    Stock INT NOT NULL CHECK (Stock >= 0)
);

-- Tabela Zamówień (Nagłówek)
CREATE TABLE Orders (
    ID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(ID),
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) DEFAULT 'NOWE'
);

-- Tabela Pozycji Zamówienia (Szczegóły)
CREATE TABLE OrderProduct (
    OrderID INT REFERENCES Orders(ID) ON DELETE CASCADE,
    ProductID INT REFERENCES Products(ID),
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(10,2) NOT NULL, -- Cena zamrożona w momencie zakupu
    PRIMARY KEY (OrderID, ProductID)
);

-- Dodanie przykładowego Administratora (Hasło: admin123)
-- Hash wygenerowany przez bcrypt
INSERT INTO Users (Username, PasswordHash, Role) 
VALUES ('admin', '$2b$10$Xw..hash..reszta..hasha', 'Administrator');
```


## 2. Uruchomienie Backend (Serwer)

Otwórz terminal w głównym katalogu projektu.

Zainstaluj zależności:

```bash
npm install
```

Skonfiguruj połączenie z bazą danych w pliku `config/db.js` (uzupełnij `host`, `user`, `password`, `database`).

Uruchom serwer:

```bash
node server.js
```

Serwer nasłuchuje na porcie **3000**.

---

## 3. Uruchomienie Frontend (Klient)

Otwórz drugi terminal i wejdź do folderu `client`.

Przejdź do katalogu klienta:

```bash
cd client
```

Zainstaluj zależności:

```bash
npm install
```

Uruchom Vite:

```bash
npm run dev
```

Aplikacja domyślnie dostępna pod adresem: **http://localhost:5173**

---

## 📂 Struktura Projektu

```plaintext
/ (Root - Backend)
├── config/
│   └── db.js               # Konfiguracja puli połączeń PostgreSQL
├── controllers/            # Logika biznesowa aplikacji
│   ├── usersController.js  # Logowanie, rejestracja, zarządzanie userami
│   ├── productsController.js # CRUD produktów
│   ├── ordersController.js   # Obsługa zamówień (transakcje, edycja)
│   └── reportsController.js  # Raporty, historia, szczegóły
├── middleware/
│   └── authMiddleware.js   # Weryfikacja tokenów JWT i ról użytkowników
├── routes/                 # Routing API (definicje endpointów)
│   ├── usersRoutes.js
│   ├── productsRoutes.js
│   ├── ordersRoutes.js
│   └── reportsRoutes.js
├── server.js               # Punkt wejścia aplikacji backendowej
└── client/ (Frontend)
    ├── src/
    │   ├── App.jsx         # Główny komponent, routing widoków i nawigacja
    │   ├── App.css         # Style globalne (Modale, Tabele, Layout)
    │   └── main.jsx        # Punkt wejścia React
    └── vite.config.js      # Konfiguracja Vite (Proxy do API)
```

---

## 🔐 Bezpieczeństwo i Walidacja

Hasła przechowywane są wyłącznie w formie zahashowanej (bcrypt).

Wszystkie wrażliwe endpointy API (np. edycja, usuwanie, raporty) chronione są przez middleware weryfikujący poprawność tokenu JWT oraz rolę użytkownika.

Formularze frontendowe posiadają walidację typów danych, a akcje destrukcyjne (usuwanie użytkownika lub produktu) wymagają potwierdzenia.

Zastosowanie zapytań parametryzowanych (Prepared Statements) chroni aplikację przed atakami SQL Injection.

---

## Autor
Jakub Marciniuk, Szymon Flis

Projekt wykonany w ramach zajęć:  
**Bazy Danych**
