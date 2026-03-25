import fs from 'fs/promises'
import path from 'path'
import { sha256, verifyMessage, loadKey } from './utils/crypto'
import * as jsonld from 'jsonld'
import { verifyProof } from './utils/merkle'

export async function verifyCredential(credential: any) {
  // extract proof
  const proof = credential.proof
  if (!proof) return { valid: false, reasons: ['no proof present'] }

  // canonicalize credential without proof (JSON-LD URDNA2015) and compute hash
  const { proof: _p, ...withoutProof } = credential
  const canonical = await jsonld.canonize(withoutProof, { algorithm: 'URDNA2015', format: 'application/n-quads' })
  const hash = sha256(canonical)

  // load anchors
  const anchorsPath = path.join('data', 'anchors.json')
  let anchors: Array<any> = []
  try { anchors = JSON.parse(await fs.readFile(anchorsPath, 'utf8')) } catch (e) { anchors = [] }
  const anchored = anchors.find(a => a.hash === hash)
  if (!anchored) return { valid: false, reasons: ['hash not anchored'] }

  const pub = await loadKey('keys/issuer.pub')
  if (!pub) return { valid: false, reasons: ['issuer public key not found'] }

  // verify signature against canonical bytes
  const ok = verifyMessage(pub, Buffer.from(canonical, 'utf8'), proof.signatureValue)
  if (!ok) return { valid: false, reasons: ['signature invalid'] }

  // if merkle data present, verify inclusion
  if (anchored.merkleRoot && anchored.merkleProof) {
    const okProof = verifyProof(anchored.hash, anchored.merkleProof, anchored.merkleRoot)
    if (!okProof) return { valid: false, reasons: ['merkle proof invalid'] }
  }

  return { valid: true, reasons: [] }
}

export async function loadCredentialById(id: string) {
  const certPath = path.join('data', 'certs', `${id}.json`)
  try {
    const raw = await fs.readFile(certPath, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}
