import fs from 'fs/promises'
import crypto from 'crypto'
import nacl from 'tweetnacl'

export async function generateKeypair() {
  const kp = nacl.sign.keyPair()
  const pub = Buffer.from(kp.publicKey).toString('base64')
  const sec = Buffer.from(kp.secretKey).toString('base64')
  return { publicKey: pub, secretKey: sec }
}

export function sha256(data: string | Buffer) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function signMessage(secretKeyBase64: string, message: Buffer) {
  const secret = Buffer.from(secretKeyBase64, 'base64')
  const sig = nacl.sign.detached(new Uint8Array(message), new Uint8Array(secret))
  return Buffer.from(sig).toString('base64')
}

export function verifyMessage(publicKeyBase64: string, message: Buffer, signatureBase64: string) {
  const pub = Buffer.from(publicKeyBase64, 'base64')
  const sig = Buffer.from(signatureBase64, 'base64')
  return nacl.sign.detached.verify(new Uint8Array(message), new Uint8Array(sig), new Uint8Array(pub))
}

export async function saveKey(path: string, data: string) {
  await fs.mkdir('keys', { recursive: true })
  await fs.writeFile(path, data, { encoding: 'utf8', flag: 'w' })
}

export async function loadKey(path: string) {
  try {
    const d = await fs.readFile(path, { encoding: 'utf8' })
    return d.trim()
  } catch (e) {
    return null
  }
}
