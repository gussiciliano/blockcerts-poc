import { JsonRpcProvider, Wallet, ContractFactory } from 'ethers'
import fs from 'fs'
import path from 'path'

async function main() {
  const rpc = process.env.ETH_RPC
  const pk = process.env.ETH_PRIVATE_KEY
  if (!rpc || !pk) throw new Error('Set ETH_RPC and ETH_PRIVATE_KEY')

  const provider = new JsonRpcProvider(rpc)
  const wallet = new Wallet(pk, provider)

  // read compiled bytecode/abi from hardhat/truffle? For PoC we'll use solc via hardcoded ABI+bytecode if available.
  // For simplicity assume user compiled and placed artifact at contracts/Anchor.json
  const artPath = path.join(process.cwd(), 'contracts', 'Anchor.json')
  if (!fs.existsSync(artPath)) throw new Error('contracts/Anchor.json artifact not found. Compile contract first.')

  const artifact = JSON.parse(fs.readFileSync(artPath, 'utf8'))
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet)
  const contract = await factory.deploy()
  await contract.deployed()
  console.log('Deployed Anchor at', contract.address)

  // Optionally write address to .env or print instructions
}

main().catch((e) => { console.error(e); process.exit(1) })
