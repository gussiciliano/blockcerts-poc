import fs from 'fs/promises'
import path from 'path'
import { sha256, verifyMessage, loadKey } from './utils/crypto'

export async function verifyCredential(credential: any) {
  // extract proof
  const proof = credential.proof
  if (!proof) return { valid: false, reasons: ['no proof present'] }

  // compute hash of credential without proof
  const { proof: _p, ...withoutProof } = credential
  const hash = sha256(JSON.stringify(withoutProof))

  // load anchors
  const anchorsPath = path.join('data', 'anchors.json')
  let anchors: Array<any> = []
  try { anchors = JSON.parse(await fs.readFile(anchorsPath, 'utf8')) } catch (e) { anchors = [] }
  const anchored = anchors.find(a => a.hash === hash)
  if (!anchored) return { valid: false, reasons: ['hash not anchored'] }

  const pub = await loadKey('keys/issuer.pub')
  if (!pub) return { valid: false, reasons: ['issuer public key not found'] }

  const ok = verifyMessage(pub, Buffer.from(hash, 'hex'), proof.signatureValue)
  if (!ok) return { valid: false, reasons: ['signature invalid'] }

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
