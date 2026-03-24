import { nanoid } from 'nanoid'
import fs from 'fs/promises'
import path from 'path'
import { sha256, signMessage, loadKey } from './utils/crypto'

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

  // compute hash of credential without proof
  const hash = sha256(JSON.stringify(credentialWithoutProof))

  // load issuer secret key
  const secret = await loadKey('keys/issuer.key')
  if (!secret) throw new Error('Issuer key not found. Run gen-keys.')

  const signature = signMessage(secret, Buffer.from(hash, 'hex'))

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
  anchors.push({ id, hash, timestamp: new Date().toISOString() })
  await fs.mkdir('data', { recursive: true })
  await fs.writeFile(anchorsPath, JSON.stringify(anchors, null, 2), 'utf8')

  return { id, certPath, hash }
}
