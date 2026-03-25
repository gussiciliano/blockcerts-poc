import { JsonRpcProvider, Wallet, Contract } from 'ethers'

// Anchor a single hex hash (without 0x) on Ethereum by sending a zero-value tx
// with the hash in the data field. Uses env vars: ETH_RPC, ETH_PRIVATE_KEY.
export async function anchorToEthereum(hashHex: string) {
  const rpc = process.env.ETH_RPC
  const pk = process.env.ETH_PRIVATE_KEY
  if (!rpc || !pk) throw new Error('ETH_RPC or ETH_PRIVATE_KEY not configured')

  const provider = new JsonRpcProvider(rpc)
  const wallet = new Wallet(pk, provider)

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    data: '0x' + hashHex
  })

  await tx.wait(1)
  return tx.hash
}

// Anchor a merkle root using a deployed Anchor contract that emits an event.
// Requires CONTRACT_ADDRESS env var or pass the address explicitly.
export async function anchorMerkleRoot(contractAddress: string | null, rootHex: string) {
  const rpc = process.env.ETH_RPC
  const pk = process.env.ETH_PRIVATE_KEY
  const addr = contractAddress || process.env.CONTRACT_ADDRESS
  if (!rpc || !pk) throw new Error('ETH_RPC or ETH_PRIVATE_KEY not configured')
  if (!addr) throw new Error('CONTRACT_ADDRESS not configured')

  const provider = new JsonRpcProvider(rpc)
  const wallet = new Wallet(pk, provider)

  const abi = [
    'function anchor(bytes32 root) external returns (bool)',
    'event AnchorRoot(bytes32 indexed root, address indexed issuer)'
  ]

  const contract = new Contract(addr, abi, wallet)
  const tx = await contract.anchor('0x' + rootHex)
  await tx.wait(1)
  return tx.hash
}

export default anchorToEthereum
