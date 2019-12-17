const { sha256 } = require('js-sha256')
const { ec } = require('elliptic')
const ethers = require('ethers')

const provider = new ethers.providers.Web3Provider(wallet)
const secp256k1 = new ec('secp256k1')

function leftpad(data, size = 64) {
  if (data.length === size) return data
  return '0'.repeat(size - data.length) + data
}

function SimpleSigner(hexPrivateKey) {
  const privateKey = secp256k1.keyFromPrivate(hexPrivateKey)
  return async data => {
    const { r, s, recoveryParam } = privateKey.sign(Buffer.from(sha256.arrayBuffer(data)))
    return {
      r: leftpad(r.toString('hex')),
      s: leftpad(s.toString('hex')),
      recoveryParam
    }
  }
}

wallet.registerRpcMessageHandler(async (originString, requestObject) => {
  const privKey = await wallet.getAppKey()
  const signer = SimpleSigner(privKey)
  const ethWallet = new ethers.Wallet(privKey, provider);

  switch (requestObject.method) {
    case 'did':
      return 'did:ethr:' + ethWallet.address
      
    case 'sign':
      const confirmed = await wallet.send({
        method: 'confirm',
        params: [`Do you want to sign, ${requestObject.params[0]}!`]
      })
      if (confirmed) {
        return signer(requestObject.params[0])
      } else {
        return false
      }
  
    default:
      throw new Error('Method not found.')
  }
})