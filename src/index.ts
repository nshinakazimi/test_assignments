import * as fs from 'fs'

type InputObject = {
  account: string,
  type: string,
  address: string,
  amount: string,
  blockNumber: number,
  payload: any,
}

type InputFile = InputObject[]

fs.readFile('./events.json', 'utf8', (err, jsonString) => {
  if (err) {
    console.log("Error readng file from disk:", err)
    return
  }
  try {
    const inputFile = JSON.parse(jsonString)
    if (inputFile.length) createNewArray(inputFile)
    else {
      console.log("Empty JSON data!")
      return
    }
  } catch (err) {
    console.log('Error parsing or creating JSON string:', err)
  }
})

const createNewArray = (inputArray: InputFile) => {

  const accounts = inputArray.map(item => item.account).filter((ele, index, self) => index === self.indexOf(ele))
  const outputFile = accounts.map(account => {

    const selectedObjects = inputArray.filter(item => item.account === account)
    const wallets = getWallets(selectedObjects)

    return { account, wallets }
  })

  const newJsonString = JSON.stringify(outputFile);
  fs.writeFile('./accounts.json', newJsonString, err => {
    if (err) {
      console.log('Error writing file', err)
    } else {
      console.log('Successfully wrote file')
    }
  })

}

const getWallets = (selectedObjects: InputObject[]) => {

  const addresses = selectedObjects.map(item => item.address).filter((ele, index, self) => index === self.indexOf(ele))
  const wallets = addresses.map(address => {

    let depositSum: bigint = BigInt(0), widrawalSum: bigint = BigInt(0), balance: bigint = BigInt(0)
    const selected = selectedObjects.filter(item => item.address == address)

    selected.filter(item => item.type === "deposit").map(item => {
      depositSum += hexToBigInt(item.amount)
    })

    selected.filter(item => item.type === "withdrawal").map(item => {
      widrawalSum += hexToBigInt(item.amount)
    })

    balance = depositSum - widrawalSum

    return { address, balance: bigintToHex(balance) }
  })

  return wallets
}

const hexToBigInt = (hex: string) => {
  if (hex.length % 2) {
    hex = '0' + hex
  }

  let highbyte = parseInt(hex.slice(0, 2), 16)
  let bn = BigInt('0x' + hex)

  if (0x80 & highbyte) {
    // bn = ~bn WRONG in JS (would work in other languages)

    // manually perform two's compliment (flip bits, add one)
    // (because JS binary operators are incorrect for negatives)
    bn = BigInt('0b' + bn.toString(2).split('').map(function (i) {
      return '0' === i ? 1 : 0
    }).join('')) + BigInt(1)
    // add the sign character to output string (bytes are unaffected)
    bn = -bn
  }

  return bn
}

const bigintToHex = (bn: bigint) => {

  if (bn < 0) return BigInt(0).toString(16)

  return BigInt(bn).toString(16)
}