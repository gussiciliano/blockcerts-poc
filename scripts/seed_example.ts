import { issueCredential } from '../src/issuer'
import { generateKeypair, saveKey } from '../src/utils/crypto'

async function ensureKeys() {
  // if keys not present, generate
  try {
    await generateKeypair()
  } catch (e) {}
}

async function main() {
  // ensure keys exist
  const kp = await generateKeypair()
  await saveKey('keys/issuer.pub', kp.publicKey)
  await saveKey('keys/issuer.key', kp.secretKey)

  const subject = { id: 'did:example:123', name: 'Alice Example', degree: { type: 'BachelorDegree', name: 'BSc Computer Science' } }
  const r = await issueCredential(subject, 'Demo University')
  console.log('Issued credential id:', r.id)
}

main().catch(e => { console.error(e); process.exit(1) })
