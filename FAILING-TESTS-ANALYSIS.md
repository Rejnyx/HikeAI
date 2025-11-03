# Analýza selhávajících testů

| Test Name | File | Kategorie | Root Cause | Proposed Fix |
|-----------|------|-----------|------------|--------------|
| should detect settlement context and prioritize accordingly | tests/integration/geocoding-intelligence.test.js | B | Test očekává vyšší skóre spolehlivosti, než kód poskytuje. | Zkontrolovat logiku pro výpočet spolehlivosti a přizpůsobit test nebo kód. |
| should detect illogical waypoint distances | tests/integration/geocoding-intelligence.test.js | A | Kód nevrací hodnotu, i když by měl. | Debugovat funkci `validateWaypointLogic`. |
| should rank results by confidence score | tests/integration/geocoding-intelligence.test.js | B | Test očekává jiné pořadí výsledků. | Zkontrolovat logiku řazení. |
| should detect waypoint too far from start | tests/integration/geocoding-intelligence.test.js | B | Test očekává, že waypoint bude považován za příliš vzdálený, ale není. | Upravit test nebo validační logiku. |
| should detect route with missing must-visit location | tests/integration/geocoding-intelligence.test.js | B | Test očekává, že trasa bude považována za neplatnou, ale není. | Upravit test nebo validační logiku. |
| should detect illogical waypoint jumps | tests/integration/geocoding-intelligence.test.js | B | Test očekává, že trasa bude považována za neplatnou, ale není. | Upravit test nebo validační logiku. |
| should detect route that is too short | tests/integration/geocoding-intelligence.test.js | B | Test očekává, že trasa bude považována za neplatnou, ale není. | Upravit test nebo validační logiku. |
| should detect dispersed waypoints (route too wide) | tests/integration/geocoding-intelligence.test.js | B | Test očekává, že trasa bude považována za neplatnou, ale není. | Upravit test nebo validační logiku. |
| should return false for invalid route | tests/integration/geocoding-intelligence.test.js | B | Test očekává, že trasa bude považována za neplatnou, ale není. | Upravit test nebo validační logiku. |
| Regex Contextual Patterns (POI System) | tests/unit/regex-contextual-patterns.test.js | B | Několik testů selhává kvůli nesprávnému očekávání. | Projít každý selhávající test a opravit očekávané hodnoty. |
| should handle null input gracefully | tests/unit/regex-contextual-patterns.test.js | A | Kód nesprávně zpracovává null vstup. | Přidat kontrolu pro null vstup. |
| should skip must-visit location that is same as start point | tests/unit/routeGenerator-edge-cases.test.js | A | Funkce pro směrování není volána se správnými argumenty. | Opravit volání funkce `getHikingRoute`. |
| should skip must-visit location that is same as end point | tests/unit/routeGenerator-edge-cases.test.js | A | Funkce pro směrování není volána se správnými argumenty. | Opravit volání funkce `getHikingRoute`. |
| should continue route generation if must-visit location fails to geocode | tests/unit/routeGenerator-edge-cases.test.js | A | Funkce pro směrování není volána se správnými argumenty. | Opravit volání funkce `getHikingRoute`. |
| should return list of all active peaks | tests/e2e/poi-api.test.js | C | Chybí připojení k databázi. | Zdokumentovat jako známý problém. |
| should return peaks ordered by elevation desc | tests/e2e/poi-api.test.js | C | Chybí připojení k databázi. | Zdokumentovat jako známý problém. |
| should search peaks by name | tests/e2e/poi-api.test.js | C | Chybí připojení k databázi. | Zdokumentovat jako známý problém. |
| should handle fuzzy matching (name variants) | tests/e2e/poi-api.test.js | C | Chybí připojení k databázi. | Zdokumentovat jako známý problém. |
| should handle SQL injection in search query | tests/e2e/poi-api.test.js | A | API nesprávně zpracovává SQL injection. | Přidat sanitizaci vstupů. |
| should handle malformed requests | tests/e2e/poi-api.test.js | A | API nesprávně zpracovává poškozené požadavky. | Přidat lepší zpracování chyb. |
| BUG #2: Sněžka should generate round trip from Sněžka, not from Praha | tests/integration/route-generation.test.js | A | AI prompt není správně zpracován pro nejasné dotazy. | Upravit AI prompt a logiku zpracování. |
| should generate valid route for simple prompt | tests/integration/route-generation.test.js | A | AI prompt není správně zpracován pro nejasné dotazy. | Upravit AI prompt a logiku zpracování. |
| should include route metadata | tests/integration/route-generation.test.js | A | AI prompt není správně zpracován pro nejasné dotazy. | Upravit AI prompt a logiku zpracování. |
