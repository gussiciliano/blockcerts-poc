import { nanoid } from 'nanoid'
import fs from 'fs/promises'
import path from 'path'
import { sha256, signMessage, loadKey } from './utils/crypto'
import * as jsonld from 'jsonld'
import { anchorToEthereum } from './utils/eth'

type Subject = { id?: string; [k: string]: any }

export async function issueCredential(subject: Subject, issuerName = 'Demo Issuer') {
  const id = nanoid(10)
  const issuanceDate = new Date().toISOString()

  const credentialWithoutProof = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: `urn:uuid:${id}`,
    type: ['VerifiableCredential', 'BlockcertsDemo'],
    issuer: issuerName,
    issuanceDate,
    credentialSubject: subject
  }

  // canonicalize (JSON-LD URDNA2015) and compute hash of credential without proof
  const canonical = await jsonld.canonize(credentialWithoutProof, { algorithm: 'URDNA2015', format: 'application/n-quads' })
  const hash = sha256(canonical)

  // load issuer secret key
  const secret = await loadKey('keys/issuer.key')
  if (!secret) throw new Error('Issuer key not found. Run gen-keys.')

  // sign the canonical representation (Ed25519 detached)
  const signature = signMessage(secret, Buffer.from(canonical, 'utf8'))

  const proof = {
    type: 'Ed25519Signature2018',
    created: new Date().toISOString(),
    proofPurpose: 'assertionMethod',
    verificationMethod: 'keys/issuer.pub',
    signatureValue: signature
  }

  const credential = { ...credentialWithoutProof, proof }

  // persist cert and anchor
  const certDir = path.join('data', 'certs')
  await fs.mkdir(certDir, { recursive: true })
  const certPath = path.join(certDir, `${id}.json`)
  await fs.writeFile(certPath, JSON.stringify(credential, null, 2), 'utf8')

  const anchorsPath = path.join('data', 'anchors.json')
  let anchors: Array<any> = []
  try { anchors = JSON.parse(await fs.readFile(anchorsPath, 'utf8')) } catch (e) { anchors = [] }
  const anchorEntry: any = { id, hash, timestamp: new Date().toISOString() }

  // try anchoring to Ethereum (simple PoC). Requires ETH_RPC and ETH_PRIVATE_KEY env vars.
  try {
    const txHash = await anchorToEthereum(hash)
    anchorEntry.ethTx = txHash
  } catch (e: any) {
    // fail silently for PoC — keep local anchoring
    console.warn('Ethereum anchoring skipped:', e.message)
  }

  anchors.push(anchorEntry)
  await fs.mkdir('data', { recursive: true })
  await fs.writeFile(anchorsPath, JSON.stringify(anchors, null, 2), 'utf8')

  return { id, certPath, hash, anchor: anchorEntry }
}
