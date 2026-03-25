# Blockcerts PoC

PoC Emisor + Verificador (simulado anchoring) en Node.js/TypeScript.

Quick start

1. Install deps

```bash
cd /Users/gustavosiciliano/unq
yarn
```

2. Generate keys

```bash
yarn gen-keys
```

3. Seed example credential

```bash
yarn seed
```

4. Start server

```bash
yarn start
```

Open `http://localhost:3000/public` to use the verification UI.

Ethereum anchoring (PoC)

- This PoC can optionally anchor credential hashes on Ethereum by sending
	a zero-value transaction with the hash in the `data` field.
- Set environment variables before running the server:

```bash
export ETH_RPC=https://your-rpc.example
export ETH_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
yarn start
```

If the vars are not set, the app will keep working and only store local anchors in `data/anchors.json`.

On‑chain vs off‑chain (por qué TypeScript + Solidity)

- On‑chain (Solidity): el contrato `contracts/Anchor.sol` es el único artefacto que necesita consenso y permanencia en la blockchain. Publica eventos (`AnchorRoot`) con la raíz Merkle o puede recibir un hash en la data de una transacción.
- Off‑chain (TypeScript): emisión, canonicalización JSON‑LD, firma Ed25519, cálculo de hashes y Merkle proofs, persistencia local, UI/HTTP API y scripts de batching/despliegue. Estas tareas son costosas, no prácticas o imposibles on‑chain por coste y limitaciones técnicas.

Deploy del contrato `Anchor` y anclaje por Merkle (opcional)

1. Preparar entorno (ejemplo con Hardhat):

```bash
# instalar herramientas (si no las tenés)
yarn add --dev hardhat @nomiclabs/hardhat-ethers ethers
npx hardhat init # o crea un proyecto hardhat en esta carpeta
```

2. Colocar `contracts/Anchor.sol` en el directorio `contracts/` y compilar:

```bash
npx hardhat compile
```

3. Desplegar el contrato (usa `scripts/deploy_anchor.ts`): exportar vars y ejecutar:

```bash
export ETH_RPC=https://sepolia.infura.io/v3/<PROJECT_ID>
export ETH_PRIVATE_KEY=0xYOUR_TEST_PRIVATE_KEY
ts-node scripts/deploy_anchor.ts
```

El script espera encontrar el artefacto compilado en `contracts/Anchor.json` (ABI + bytecode). Tras el despliegue, anota la dirección (`CONTRACT_ADDRESS`) y úsala para `scripts/anchor_batch.ts`.

4. Ejecutar batching para agrupar anchors y publicar la raíz Merkle:

```bash
export CONTRACT_ADDRESS=0x... # dirección del contrato desplegado
ts-node scripts/anchor_batch.ts
```

Precauciones
- Usá únicamente claves de prueba en testnets. No subir `ETH_PRIVATE_KEY` a repositorios.
- Publicar en mainnet implica costes de gas.


Blockcerts / JSON-LD compatibility (current PoC state)

- This PoC was extended to move toward Blockcerts compatibility:
	- JSON‑LD canonicalization (URDNA2015) is used before hashing (`jsonld`).
	- Credentials are signed with Ed25519 (proof in the credential JSON). A Linked‑Data public key artifact is written to `keys/issuer-ld.json`.
	- Anchors are batched into a Merkle root and can be published on‑chain via an `Anchor` contract event (`contracts/Anchor.sol`).
	- Utility scripts added: `scripts/deploy_anchor.ts` and `scripts/anchor_batch.ts`.

- New useful commands:

```bash
# install deps (after editing package.json)
yarn install

# generate keys (also creates keys/issuer-ld.json)
yarn gen-keys

# start server
yarn start

# compile & deploy contract (requires compiled artifact at contracts/Anchor.json)
node scripts/deploy_anchor.ts

# compute merkle root for pending anchors and anchor to chain
node scripts/anchor_batch.ts
```

- Notes & next steps:
	- The project currently uses `jsonld.canonize(...)` and a PoC signing approach. For full Blockcerts compatibility you should integrate `jsonld-signatures` + `ed25519-signature-2018` (recommended next step).
	- Keep private keys safe; use only test keys with testnets. See `IMPROVEMENTS.md` for risks and follow‑ups.
