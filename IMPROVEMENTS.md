# Faltantes y Mejoras — Blockcerts PoC

Resumen conciso de los elementos faltantes, riesgos y mejoras sugeridas para el PoC.

**Contexto:** PoC implementado en Node.js/TypeScript con emisor (`src/issuer.ts`), verificador (`src/verifier.ts`), servidor (`src/server.ts`), utilidades (`src/utils/crypto.ts`), scripts y UI mínima (`public/index.html`). Anchoring simulado en `data/anchors.json`.

**Crítico (corregir antes de demo pública)**
- **Persistencia segura:** `data/anchors.json` se lee/escribe sin control de concurrencia; **riesgo:** corrupción por race conditions. Soluciones: migrar a SQLite o añadir un append-only log con locking.
- **Validación de inputs:** Falta validación estructural de payloads para `POST /issue` y `POST /verify`. Añadir validación con `ajv` o similar (esquemas JSON/VC mínimos) para evitar inputs malformados.
- **Determinismo del hash:** Actualmente el hash se calcula usando `JSON.stringify` (orden de propiedades no garantizado). Usar canonical JSON o ordenar keys para evitar falsos negativos en verificación.
- **Manejo de claves:** Claves guardadas en `keys/` en texto plano (aceptable para PoC, peligroso en producción). Documentar y evitar commit; recomendar secret manager/HSM en prod.

**Alta prioridad (mejoran fiabilidad y pruebas)**
- **Tests unitarios:** Añadir tests para firma/verificación (round-trip) y para endpoints principales. Priorizar `src/utils/crypto.ts`, `issuer` y `verifier`.
- **No regenerar claves en seed:** `scripts/seed_example.ts` actualmente genera claves cada ejecución. Cambiar para generar sólo si no existen.
- **Manejo de errores y respuestas:** Estandarizar respuestas de error (por ejemplo `{ error: string, code?: string }`) y validar campos obligatorios.

**Media prioridad (mejoras UX/operacional)**
- **OpenAPI / API docs:** Añadir un `openapi.yaml` o documentación de endpoints (`/issue`, `/verify`, `/cert/:id`, `/cert/:id/qrcode`).
- **CORS y rate-limiting:** Añadir `cors` y `express-rate-limit` si la API se expone públicamente.
- **Build/production scripts:** Añadir `build` y `start:prod` (compilar TS a `dist/`). Considerar `Dockerfile` para despliegues.
- **Lint/format:** Añadir `eslint` y `prettier` para consistencia de código.

**Baja prioridad (mejoras para interoperabilidad y features)**
- **JSON-LD / W3C VC compatibilidad:** Usar `jsonld` y considerar Linked Data Signatures / LD-CANON para compatibilidad con wallets/verificadores externos.
- **Generación de QR en UI y endpoint:** Ya se añadió `/cert/:id/qrcode` y botón en `public/index.html`; documentar uso en README.
- **UI/UX para emisión:** Añadir UI para emitir certificados desde el navegador (form simple que hace `POST /issue`).
- **Integración con wallets:** Exportar credenciales en formatos aceptados por wallets (VC JSON) y probar import.

**Operacional / DevOps**
- **CI:** Añadir GitHub Actions para ejecutar tests y lint.
- **Backup y migraciones:** Si se migra a DB, añadir scripts de migración y backup para `anchors` y `certs`.

**Sugerencia de prioridades para los próximos pasos (mínimo viable)**
1. Añadir validación (`ajv`) y tests unitarios para crypto (1-2 días).
2. Corregir persistencia (migrar a SQLite) y actualizar lectura/escritura (0.5-1 día).
3. Evitar regeneración de claves en `seed` y documentar workflow de claves (0.25 día).

**Archivos a modificar (referencia)**
- `src/server.ts` — añadir validación, CORS, rate-limiting y respuesta estandarizada.
- `src/issuer.ts` — usar canonical JSON antes de hashear; validar input.
- `src/verifier.ts` — devolver razones explícitas y códigos de error.
- `scripts/seed_example.ts` — no regenerar claves si existen.
- `README.md` — añadir ejemplos de payloads, flujo (issue → verify → QR) y limitaciones.
- `package.json` — añadir scripts `build`, `start:prod`, y dependencias de test/lint.

**Testnets y pruebas de anclaje (Ethereum)**

- **Qué es / por qué:** Usar una testnet permite probar el anclaje en una cadena real sin gastar ETH real. Ideal para validar que la transacción que contiene el hash se publica correctamente.
- **Redes recomendadas:** Sepolia o Goerli (Sepolia suele ser la más estable recientemente).
- **Cómo probar (rápido):** consigue un RPC (Infura/Alchemy/otro) y test-ETH desde un faucet, luego exporta las variables de entorno y arranca la app:

```bash
export ETH_RPC=https://sepolia.infura.io/v3/<PROJECT_ID>
export ETH_PRIVATE_KEY=0x...   # cuenta de prueba con test-ETH
yarn
yarn start
```

- Emite un credential desde la UI (`/public`) o con `POST /issue`; el PoC intentará enviar una tx que incluirá el hash en `data` y guardará el `ethTx` en `data/anchors.json`.
- **Precauciones:**
	- Usa sólo claves de prueba en testnets; no pongas claves reales en `ETH_PRIVATE_KEY` ni en repositorios.
	- Las transacciones en testnet siguen gastando gas (test-ETH). Usa un faucet oficial para obtener fondos.
	- Si quieres evitar gestionar claves, considera usar una cuenta temporal o un servicio de relayer en pruebas.

Agregar pruebas automáticas que mockeen `anchorToEthereum` puede ayudar a no depender de la testnet para CI.

Si quieres, puedo implementar la primera prioridad ahora: añadir `ajv` para validación y crear tests unitarios para la firma/verificación. ¿Procedo con eso?
