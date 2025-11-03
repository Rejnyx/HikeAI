# Známé problémy s testy

## Testy, které vyžadují živé závislosti

### 1. POI API Integration Tests (6 tests)
**Proč selhávají:** Vyžadují připojení k Supabase
**Prostředí:** Pouze produkce/staging
**Přeskočit v CI:** Ano (přidat `test.skip` nebo kontrolu prostředí)

### 2. Analytics Tests
**Proč selhávají:** Vyžadují přístup pro zápis do `analytics.db`
**Oprava:** Použít in-memory SQLite pro testy
