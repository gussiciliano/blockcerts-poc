import { sha256 } from './crypto'

function normHex(hex: string) {
  return (hex.startsWith('0x') ? hex.slice(2) : hex).toLowerCase()
}

export function merkleRoot(hexLeaves: string[]): string {
  if (!hexLeaves || hexLeaves.length === 0) return ''
  let nodes = hexLeaves.map(h => normHex(h))

  while (nodes.length > 1) {
    const next: string[] = []
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i]
      const right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i]
      const combined = Buffer.from(left + right, 'hex')
      const h = sha256(combined)
      next.push(h)
    }
    nodes = next
  }

  return nodes[0]
}

export function merkleProof(hexLeaves: string[], index: number) {
  const leaves = hexLeaves.map(h => normHex(h))
  const proof: Array<{ sibling: string; position: 'left' | 'right' }> = []
  let idx = index
  let layer = leaves.slice()

  while (layer.length > 1) {
    const next: string[] = []
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]
      const right = i + 1 < layer.length ? layer[i + 1] : layer[i]
      next.push(sha256(Buffer.from(left + right, 'hex')))
      if (i === idx || i + 1 === idx) {
        const isLeft = idx % 2 === 0
        const sibling = isLeft ? right : left
        proof.push({ sibling, position: isLeft ? 'right' : 'left' })
        idx = Math.floor(i / 2)
      }
    }
    layer = next
  }

  return proof
}

export function verifyProof(leafHex: string, proof: Array<{ sibling: string; position: 'left' | 'right' }>, rootHex: string) {
  let hash = normHex(leafHex)
  for (const p of proof) {
    if (p.position === 'left') {
      hash = sha256(Buffer.from(p.sibling + hash, 'hex'))
    } else {
      hash = sha256(Buffer.from(hash + p.sibling, 'hex'))
    }
  }
  return normHex(rootHex) === hash
}

export default merkleRoot
