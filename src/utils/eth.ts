import { ethers } from 'ethers'

// Anchor a hex hash (without 0x) on Ethereum by sending a zero-value tx
// with the hash in the data field. Uses env vars: ETH_RPC, ETH_PRIVATE_KEY.
export async function anchorToEthereum(hashHex: string) {
  const rpc = process.env.ETH_RPC
  const pk = process.env.ETH_PRIVATE_KEY
  if (!rpc || !pk) throw new Error('ETH_RPC or ETH_PRIVATE_KEY not configured')

  const provider = new ethers.providers.JsonRpcProvider(rpc)
  const wallet = new ethers.Wallet(pk, provider)

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    data: '0x' + hashHex
  })

  // wait for 1 confirmation
  await tx.wait(1)
  return tx.hash
}

export default anchorToEthereum
