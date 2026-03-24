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
