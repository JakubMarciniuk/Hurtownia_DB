Hurtownia DB API (PostgreSQL)

API służące do zarządzania operacjami w systemie hurtowni, obejmujące zarządzanie użytkownikami, produktami, zamówieniami oraz raportowaniem.

Jak korzystać z kolekcji
Skonfiguruj środowisko (np. adres http://localhost:3000) zgodnie z uruchomioną instancją API.

W folderach znajdziesz pogrupowane żądania:

1. Użytkownik – operacje na klientach/użytkownikach systemu,

2. Produkt – zarządzanie produktami i stanami magazynowymi,

3. Zamówienie – obsługa cyklu życia zamówienia oraz raporty.

Przy każdym żądaniu znajdziesz opis:

cel biznesowy endpointu,

metodę HTTP i adres URL,

wymagane parametry ścieżki, zapytania i body,

typowe odpowiedzi sukcesu i błędów.

Logika biznesowa API uwzględnia m.in. atomowość składania zamówień, reguły integralności (np. ograniczenia usuwania produktów) oraz statusy zamówień: NOWE, W TRAKCIE REALIZACJI, WYSŁANE, ZREALIZOWANE, ANULOWANE. Szczegóły poszczególnych operacji znajdują się w opisach żądań.
