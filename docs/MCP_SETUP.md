# MCP Servery - Setup Guide

**Status:** ✅ Částečně nakonfigurováno
**Created:** 29. října 2025

---

## Co jsou MCP Servery?

**MCP (Model Context Protocol)** umožňuje Claudeovi připojit se k externím nástrojům a službám:

- **Supabase MCP** → Můžu přímo spravovat tvou databázi (SQL queries, tabulky, data)
- **Perplexity MCP** → Můžu vyhledávat aktuální informace na internetu

---

## ✅ Co je již nakonfigurováno:

### 1. **API Keys uloženy**

✅ **Backend .env** (`backend/.env`):
- OpenAI API key
- Supabase URL + Key

✅ **Mobile .env** (`mobile/.env`):
- API URL placeholder (změň po spuštění ngrok)

### 2. **MCP Config vytvořena**

✅ **Claude Desktop Config** (`%APPDATA%/Claude/claude_desktop_config.json`):
- Supabase MCP - ✅ **Nakonfigurován**
- Perplexity MCP - ⏳ **Čeká na API key**

---

## ⏳ Co musíš dokončit TY (David):

### 1. Získat Perplexity API Key

**Kroky:**

1. **Jdi na Perplexity:**
   - https://www.perplexity.ai/

2. **Sign up / Log in:**
   - Můžeš použít Google account

3. **Navigate to API Portal:**
   - Po přihlášení jdi na: https://www.perplexity.ai/account/api
   - Nebo: Settings → API

4. **Create API Key:**
   - Click **"Create API Key"**
   - Name: "Claude MCP"
   - Click **Generate**

5. **Copy API Key:**
   ```
   pplx-xxxxxxxxxxxxxxxxxxxxx
   ```
   **⚠️ Zobrazí se pouze jednou!** Zkopíruj ho hned.

6. **Update MCP Config:**
   - Otevři: `%APPDATA%\Claude\claude_desktop_config.json`
   - Najdi řádek: `"PERPLEXITY_API_KEY": "YOUR_PERPLEXITY_API_KEY_HERE"`
   - Nahraď `YOUR_PERPLEXITY_API_KEY_HERE` svým API key
   - Ulož soubor

**Poznámka:** Perplexity API má free tier, ale může být limitovaný. Pro production budeš možná potřebovat paid plan.

---

### 2. Restart Claude Desktop

**Po uložení Perplexity API key:**

1. **Zavři Claude Desktop úplně:**
   - Windows: Pravý klik na tray icon → Exit
   - Nebo: Task Manager → End Task

2. **Otevři znovu Claude Desktop:**
   - Spusť z Start menu

3. **Ověř MCP servery:**
   - V Claude chatu napiš: *"Jaké MCP servery máš k dispozici?"*
   - Měl bych vidět: **supabase** + **perplexity**

---

## 🧪 Testování MCP Serverů

### Test Supabase MCP

Po restartu Claude zkus:

```
"Připoj se k mé Supabase databázi a zobraz všechny tabulky."
```

**Expected:**
- Měl bych vidět: `routes`, `route_variants`, `regions`, `generation_logs`

### Test Perplexity MCP

```
"Vyhledej pomocí Perplexity: Jaké jsou aktuální trendy v hiking aplikacích 2025?"
```

**Expected:**
- Vyhledám online a vrátím aktuální informace

---

## 📂 Config Soubor Reference

**Lokace:** `%APPDATA%\Claude\claude_desktop_config.json`

**Full path:** `C:\Users\david\AppData\Roaming\Claude\claude_desktop_config.json`

**Aktuální obsah:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server@latest",
        "https://caxxzcfdqcfehrsmsedy.supabase.co",
        "eyJhbGc..."
      ]
    },
    "perplexity": {
      "command": "npx",
      "args": [
        "-y",
        "@perplexity-ai/mcp-server"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "YOUR_PERPLEXITY_API_KEY_HERE",  // ← ZMĚŇ TOTO
        "PERPLEXITY_TIMEOUT_MS": "600000"
      }
    }
  }
}
```

---

## 🛠️ Co budou MCP servery umožňovat?

### Supabase MCP Tools:

✅ **Database Management:**
- Vytvářet a upravovat tabulky
- Spouštět SQL queries
- Vkládat/upravovat/mazat data
- Sledovat database schema

✅ **Real-time Work:**
- Můžu přímo testovat routes v databázi
- Debugovat data issues
- Seedovat testovací data

**Příklad:**
```
"Vlož testovací trasu do routes tabulky: Lysá hora z Ostravice, 12km."
```

### Perplexity MCP Tools:

✅ **Web Search:**
- Vyhledávat aktuální informace
- Research konkurence
- Najít API dokumentaci
- Ověřit tech stack best practices

✅ **Reasoning:**
- Deep research na složité otázky
- Kombinace více zdrojů

**Příklad:**
```
"Vyhledej nejlepší GraphHopper alternativy pro hiking route planning."
```

---

## 🐛 Troubleshooting

### Issue: MCP servery se nenačetly po restartu

**Checklist:**

1. **Config file existuje?**
   ```bash
   ls "%APPDATA%\Claude\claude_desktop_config.json"
   ```

2. **JSON je validní?**
   - Zkontroluj syntax (commas, brackets)
   - Použij JSON validator: https://jsonlint.com/

3. **Perplexity API key je vyplněn?**
   - Nesmí být "YOUR_PERPLEXITY_API_KEY_HERE"

4. **Claude Desktop je zavřený úplně?**
   - Check Task Manager (Ctrl+Shift+Esc)
   - Hledej "Claude" proces
   - End task pokud běží

---

### Issue: Supabase MCP nefunguje

**Solution:**

1. **Test Supabase credentials:**
   ```bash
   curl https://caxxzcfdqcfehrsmsedy.supabase.co/rest/v1/ \
     -H "apikey: YOUR_SUPABASE_KEY"
   ```

2. **Ověř že Supabase projekt běží:**
   - Jdi na: https://supabase.com/dashboard
   - Check project status

---

### Issue: Perplexity MCP timeout

**Solution:**

- Timeout je nastavený na 600000ms (10 minut)
- Pokud stále timeoutuje, zvyš hodnotu:
  ```json
  "PERPLEXITY_TIMEOUT_MS": "900000"  // 15 minut
  ```

---

### Issue: npx command not found

**Solution:**

MCP servery používají `npx` (Node Package Runner). Ujisti se, že máš Node.js nainstalovaný:

```bash
node --version
npm --version
npx --version
```

Pokud ne, nainstaluj Node.js 20+ z https://nodejs.org/

---

## 📊 Status Checklist

Po dokončení setup:

- [x] Backend .env vytvořen s API keys
- [x] Mobile .env vytvořen
- [x] MCP config vytvořena
- [x] Supabase MCP nakonfigurován
- [ ] **Perplexity API key získán** ← **TY musíš udělat**
- [ ] **Perplexity API key updatován v config** ← **TY musíš udělat**
- [ ] **Claude Desktop restartován**
- [ ] **MCP servery testovány a fungují**

---

## 🚀 Next Steps

Po dokončení MCP setup:

1. ✅ Test Supabase connection
2. ✅ Test Perplexity search
3. → **Pokračuj s implementací Hike AI:**
   - AI route generation
   - Map view component
   - Backend API logic

---

**Questions?** Napiš mi do chatu a pomůžu ti! 🛠️

*Created by: Winston (Architect)*
*Date: 29. října 2025*
