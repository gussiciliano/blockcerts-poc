import { generateKeypair, saveKey } from '../src/utils/crypto'
import bs58 from 'bs58'
import fs from 'fs/promises'

async function main() {
  const kp = await generateKeypair()
  await saveKey('keys/issuer.pub', kp.publicKey)
  await saveKey('keys/issuer.key', kp.secretKey)

  // Also generate a Linked Data compatible public key (base58) for LD signatures
  // tweetnacl publicKey is base64; convert to base58
  const pubBuf = Buffer.from(kp.publicKey, 'base64')
  const pub58 = bs58.encode(pubBuf)

  const ld = {
    id: 'keys/issuer-ld',
    type: 'Ed25519VerificationKey2018',
    controller: 'urn:example:issuer',
    publicKeyBase58: pub58
  }

  await fs.mkdir('keys', { recursive: true })
  await fs.writeFile('keys/issuer-ld.json', JSON.stringify(ld, null, 2), 'utf8')

  console.log('Keys generated in keys/ (issuer.pub, issuer.key, issuer-ld.json)')
}

main().catch(e => { console.error(e); process.exit(1) })
