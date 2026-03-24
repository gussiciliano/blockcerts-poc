import { generateKeypair, saveKey } from '../src/utils/crypto'

async function main() {
  const kp = await generateKeypair()
  await saveKey('keys/issuer.pub', kp.publicKey)
  await saveKey('keys/issuer.key', kp.secretKey)
  console.log('Keys generated in keys/ (issuer.pub, issuer.key)')
}

main().catch(e => { console.error(e); process.exit(1) })
