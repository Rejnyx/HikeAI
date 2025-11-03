# 🚀 Quick Start: Mass Route Testing

## Spusť před spaním:

```bash
cd backend
npm run test:mass
```

✅ **To je vše!** Test vygeneruje 100 tras během 3-4 hodin.

---

## Co to dělá?

- 🏔️ Testuje **10 vrcholů** (Praděd, Sněžka, Lysá hora...)
- 🧪 **10 scénářů** pro každý vrchol (parking, train, roundtrip...)
- 📊 Loguje vše do **analytics databáze**
- 💾 Vytváří **CSV + JSON** reports
- ⏱️ **2 sekundy** delay mezi requesty

---

## Co najdeš ráno?

📁 **`backend/test-results/`**
- `mass-test-2025-11-02.csv` - importuj do Excel
- `mass-test-2025-11-02.json` - detailní report

📊 **Analytics API:**
```bash
curl http://localhost:3000/api/v1/analytics/summary
curl http://localhost:3000/api/v1/analytics/vague-errors
```

---

## Očekávané výsledky:

| Metrika | Očekávaná hodnota |
|---------|-------------------|
| ✅ Success Rate | 20-30% |
| ⚠️ Vague Errors | 60-70% |
| ❌ Other Errors | 5-10% |
| ⏱️ Avg Response | 1-2s |
| 🏆 Top Pattern | vague:parking |

---

## Co dělat s daty?

1. ✅ Otevři CSV v Excelu
2. 📊 Zkontroluj vague error breakdown
3. 🎯 Identifikuj top 5 patterns
4. 🚀 Implementuj Level 2 smart suggestions
5. 🔄 Re-run test a měř zlepšení

---

## Potřebuješ víc detailů?

👉 [Kompletní dokumentace](./tests/load/README.md)

---

💡 **Tip:** Backend musí běžet! Otevři nový terminál pro test.
