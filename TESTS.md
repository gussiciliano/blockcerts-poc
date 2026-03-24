# Tests and How to Validate the PoC

This document lists manual and automated ways to test the Blockcerts PoC locally.
Run all commands from the project root: `/Users/gustavosiciliano/unq`.

## Prerequisites
- Install dependencies: `yarn`
- Generate issuer keys: `yarn gen-keys`
- Start the server: `yarn start` (or `yarn dev` for hot-reload)

UI is served at: `http://localhost:3000/public`

---

## Manual (UI)

1. Open `http://localhost:3000/public`.
2. Click **Issue** (or use the API to `POST /issue`) to create a credential.
3. Paste the JSON credential into the textarea and press **Verify**. Expect a JSON result with `valid: true`.
4. Enter the credential `id` and press **Generate QR** to see the QR image.

---

## Manual (curl / Postman)

Issue a credential:

```bash
curl -s -X POST http://localhost:3000/issue \
  -H "Content-Type: application/json" \
  -d '{"subject":{"id":"did:example:alice","name":"Alice"},"issuer":"Demo Univ"}' | jq
```

Get the credential JSON (replace `<ID>`):

```bash
curl -s http://localhost:3000/cert/<ID> | jq
```

Verify by URL:

```bash
curl -s -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"url":"/cert/<ID>"}' | jq
```

Download QR image:

```bash
curl -s http://localhost:3000/cert/<ID>/qrcode --output cert_<ID>.png
open cert_<ID>.png   # macOS
```

Tamper-test (should fail): download the credential, modify a field, then POST it to `/verify` and expect `valid: false`.

---

## Quick E2E script (bash)

```bash
resp=$(curl -s -X POST http://localhost:3000/issue -H "Content-Type: application/json" -d '{"subject":{"id":"did:example:e2e","name":"E2E User"},"issuer":"Demo"}')
id=$(echo "$resp" | jq -r '.id')
echo "issued id: $id"
curl -s -X POST http://localhost:3000/verify -H "Content-Type: application/json" -d "{\"url\":\"/cert/$id\"}" | jq
```

Expected: verification returns `{"valid":true,...}`.

---

## Developer checks / diagnostics
- Confirm credential and anchor were persisted:
  - `ls data/certs` — contains `<ID>.json`
  - `cat data/anchors.json` — contains an entry with the credential hash
- Inspect keys: `ls keys` (`issuer.key`, `issuer.pub`). Do NOT commit these.
- Compile TypeScript for errors: `yarn tsc --noEmit`

---

## Suggested automated tests (to implement)
- Unit tests (Jest or similar):
  - `utils/crypto` sign/verify round-trip with generated keypair.
  - `issuer.issueCredential` writes file and appends anchor.
  - `verifier.verifyCredential` returns valid for correct cert and invalid for tampered cert.
- Integration test (supertest): start server in test mode, call `POST /issue`, `GET /cert/:id`, `POST /verify`.

Examples of scripts to add to `package.json` later:

```json
"scripts": {
  "test": "jest",
  "test:e2e": "bash ./scripts/e2e_test.sh"
}
```

---

## Notes and gotchas
- If you re-run `yarn gen-keys` you will replace the issuer keypair; existing certificates will fail verification.
- Anchoring is simulated: `data/anchors.json` is a local file. For production use a blockchain anchoring step.
- The PoC computes hashes using `JSON.stringify`. For reliable hashing across environments use canonical JSON or JSON-LD normalization.

If you want, I can add automated unit tests and an `e2e` script now; which do you prefer first? 

---

## Explicación del JSON del certificado (campo a campo)

Cuando llamaste `GET /cert/FetAuefnfB` recibiste un JSON como este. Aquí se explica cada campo y qué significa:

- `@context`: Vocabulario W3C para Verifiable Credentials; define semántica.
- `id`: Identificador único del certificado (ej. `urn:uuid:FetAuefnfB`). Útil para referenciar el certificado.
- `type`: Tipos del documento (`VerifiableCredential` y etiqueta del PoC).
- `issuer`: Quién emitió el certificado (p. ej. `Demo Univ`).
- `issuanceDate`: Fecha/hora de emisión.
- `credentialSubject`: Datos del titular (por ejemplo `id` y `name`).
- `proof`: Prueba criptográfica que confirma la emisión:
  - `type`: Esquema de firma usado (Ed25519Signature2018 en este PoC).
  - `created`: Fecha/hora en que se generó la prueba.
  - `proofPurpose`: Propósito de la firma (por ejemplo `assertionMethod`).
  - `verificationMethod`: Referencia a la clave pública del emisor (`keys/issuer.pub`).
  - `signatureValue`: Firma en Base64 (Ed25519 detached). Sirve para verificar que el emisor firmó ese contenido.

En la práctica, la verificación implica comprobar la firma (usando la clave pública) y comprobar que la huella (hash) del certificado esté registrada en `data/anchors.json`.

## Comandos rápidos para verificar el certificado que obtuviste

# Mostrar el certificado (ya lo hiciste):
```bash
curl -s http://localhost:3000/cert/FetAuefnfB | jq
```

# Verificar por URL (firma + anchoring):
```bash
curl -s -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"url":"/cert/FetAuefnfB"}' | jq
```

# Verificar enviando directamente el objeto credential (por si lo descargaste y lo modificaste):
```bash
curl -s -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"credential": <PEGA_EL_JSON_AQUI>}' | jq
```

Si la verificación devuelve `valid: true` significa que la firma es correcta y la huella está anclada. Si devuelve `valid: false` revisa `reasons` para ver si falló la firma o si el hash no está en `data/anchors.json`.
