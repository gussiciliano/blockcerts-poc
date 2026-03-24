import fs from 'fs/promises'
import path from 'path'
import { merkleRoot } from '../src/utils/merkle'
import { anchorMerkleRoot } from '../src/utils/eth'

async function main() {
  const anchorsPath = path.join('data', 'anchors.json')
  let anchors: any[] = []
  try { anchors = JSON.parse(await fs.readFile(anchorsPath, 'utf8')) } catch (e) { anchors = [] }

  // select anchors without ethTx/root
  const pending = anchors.filter(a => !a.ethTx && !a.merkleRoot)
  if (pending.length === 0) {
    console.log('No pending anchors')
    return
  }

  const leaves = pending.map(p => p.hash)
  const root = merkleRoot(leaves)
  console.log('Computed merkle root:', root)

  // anchor via contract
  const txHash = await anchorMerkleRoot(null, root)
  console.log('Anchored merkle root tx:', txHash)

  // update anchors with proofs
  const now = new Date().toISOString()
  for (let i = 0; i < pending.length; i++) {
    const p = pending[i]
    const proof = (await import('../src/utils/merkle')).merkleProof(leaves, i)
    p.merkleRoot = root
    p.merkleAnchoredAt = now
    p.merkleTx = txHash
    p.merkleIndex = i
    p.merkleProof = proof
  }

  await fs.writeFile(anchorsPath, JSON.stringify(anchors, null, 2), 'utf8')
}

main().catch(e => { console.error(e); process.exit(1) })
