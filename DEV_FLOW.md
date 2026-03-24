# Developer Flow — Technical Reference

This document explains the PoC internals and developer-facing details: data models, crypto flow, endpoints, file layout, and recommended improvements.

## Overview

The PoC implements a minimal Blockcerts-like pipeline: an **Issuer** creates and signs Verifiable Credentials (VC-like JSON), a simulated **Anchoring** stores the content hash, and a **Verifier** checks signature + anchored hash. The code is in `src/` and the HTTP surface is in `src/server.ts`.

## Components

- `src/issuer.ts` — issuance logic: assemble credential, compute hash, sign, persist credential and anchor.
- `src/verifier.ts` — verification logic: compute hash, check anchor store, verify signature.
- `src/utils/crypto.ts` — crypto helpers: Ed25519 key generation (tweetnacl), sign/verify, sha256 helper, key file I/O.
- `src/server.ts` — Express HTTP API and static UI mount (`public/`). Also the QR endpoint.
- `scripts/` — convenience scripts: `generate_keys.ts`, `seed_example.ts`.
- `public/index.html` — minimal verification UI.
- Persistence: `data/certs/{id}.json` and `data/anchors.json`; keys in `keys/` (private and public base64 strings).

## Data model (credential)

Simplified credential produced by the PoC (example):

{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "id": "urn:uuid:<id>",
  "type": ["VerifiableCredential","BlockcertsDemo"],
  "issuer": "Demo Issuer",
  "issuanceDate": "2026-03-24T...Z",
  "credentialSubject": { /* subject data */ },
  "proof": {
    "type": "Ed25519Signature2018",
    "created": "...",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "keys/issuer.pub",
    "signatureValue": "<base64 signature>"
  }
}

Notes:
- `signatureValue` is a base64 Ed25519 detached signature of the canonicalized credential payload (the PoC signs the SHA256 of JSON.stringify(withoutProof) — see improvements below).

## Crypto & hashing

- Keypair format: `tweetnacl` generated; `generateKeypair()` stores `keys/issuer.pub` and `keys/issuer.key` as base64 strings (publicKey and secretKey respectively).
- Signature: PoC uses Ed25519 detached signature over the SHA256 hash of the credential object WITHOUT the `proof` field.
- Hash: `sha256(JSON.stringify(credentialWithoutProof))` (hex encoded) currently used as anchor value.

Recommendation: move to canonical JSON (or JSON-LD canonicalization) before hashing to ensure deterministic hashes independent of property ordering.

## HTTP API (surface)

- `POST /issue` — body: `{ subject: object, issuer?: string }` → creates credential, signs it, persists `data/certs/{id}.json`, appends `{ id, hash, timestamp }` to `data/anchors.json`. Response: `{ ok: true, id, certUrl }`.
- `GET /cert/:id` — returns the stored credential JSON.
- `GET /cert/:id/qrcode` — returns PNG QR that points to `/cert/:id` (uses `qrcode` lib).
- `POST /verify` — body: `{ credential?: object, url?: string }` — verifies signature and anchored hash, returns `{ valid: boolean, reasons: string[] }`.
- `GET /verify?url=/cert/:id` — shorthand to verify by URL.

Error handling: current responses are ad-hoc (400/500 + JSON). Consider normalizing to `{ error: string, code?: string }`.

## Issuance flow (step-by-step)

1. Client calls `POST /issue` with `subject` payload.
2. Server (Issuer): build `credentialWithoutProof` with `@context`, `id`, `type`, `issuer`, `issuanceDate`, `credentialSubject`.
3. Compute `hash = sha256(JSON.stringify(credentialWithoutProof))`.
4. Load `keys/issuer.key` (base64 secretKey) and compute `signature = signMessage(secretKey, Buffer.from(hash, 'hex'))`.
5. Build `proof` object with `signatureValue` and attach to credential.
6. Persist credential to `data/certs/{id}.json` and append anchor `{ id, hash, timestamp }` to `data/anchors.json`.
7. Return `id` and `certUrl` to caller.

## Verification flow (step-by-step)

1. Verifier supplies credential JSON or URL (e.g., `/cert/:id`).
2. Server extracts `proof` and computes `hash` over credential minus proof.
3. Server loads `data/anchors.json` and checks whether `hash` exists.
4. Server loads `keys/issuer.pub` (base64) and verifies signature: `verifyMessage(pub, Buffer.from(hash, 'hex'), proof.signatureValue)`.
5. Return `{ valid: true }` if both anchor exists and signature verifies; otherwise return `valid: false` with reasons.

## File layout & important paths

- `src/` — TypeScript source
- `scripts/` — helper scripts
- `public/` — static UI
- `keys/issuer.key` — base64 private key (do not commit)
- `keys/issuer.pub` — base64 public key
- `data/certs/` — stored credential JSON files
- `data/anchors.json` — anchor list (array)

## Running locally

1. Install deps: `yarn`.
2. Generate keys: `yarn gen-keys` (creates `keys/issuer.pub` & `keys/issuer.key`).
3. (Optional) Seed an example: `yarn seed`.
4. Start server: `yarn start`.
5. Open UI: `http://localhost:3000/public`.

## Current limitations & developer notes

- Hash determinism: using `JSON.stringify` may produce different hashes for semantically identical objects. Use deterministic serialization (canonical JSON) or JSON-LD normalization for production.
- Concurrency: `data/anchors.json` is updated by reading full file, pushing an entry, writing back. This is vulnerable to race conditions; migrate to a DB (SQLite/Postgres) or implement file locking/append-only log.
- Keys: generated and stored as base64 strings on disk. For production use a secure key store or HSM.
- Validation: input payloads are not schema-validated. Add `ajv` schemas for `POST /issue` and `POST /verify`.

## Tests and CI

- Suggested unit tests:
  - `crypto.sign` / `crypto.verify` round-trip (use generated keypair)
  - `issuer.issueCredential` creates cert file and appends anchor
  - `verifier.verifyCredential` returns `valid: true` for good cert and `false` for altered cert
- Suggested integration tests:
  - End-to-end: `POST /issue` → `GET /cert/:id` → `POST /verify` → expect `valid: true`.

## Next improvements (developer backlog)

1. Replace anchor store with SQLite and provide transactional appends.
2. Add AJV schemas and request validation middleware.
3. Use canonical JSON / JSON-LD normalization before hashing.
4. Add linting, unit tests and CI workflow.
5. Add optional real anchoring to a testnet (Bitcoin testnet) for a production-like demo.

---

If you want, I can implement any of the backlog items now (e.g., add AJV validation + tests, or migrate anchors to SQLite). Specify which and I'll start.
