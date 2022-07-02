const Web3 = require('web3')
const yargs = require('yargs')

const estimateGasPrice = async (web3) => {
  const minimumPrice = Web3.utils.toBN(Web3.utils.toWei('1.5', 'gwei'))
  const gasPrice = await web3.eth.getGasPrice()
  if (gasPrice) {
    const networkPrice = Web3.utils.toBN(gasPrice)
    return networkPrice.lt(minimumPrice) ? minimumPrice : networkPrice
  }
  return minimumPrice
}

const send = async ({
  web3,
  account,
  receiverAddress,
  count,
  amount,
  noWait,
}) => {
  const amountInWei = Web3.utils.toWei(amount, 'ether')
  const gasLimit = 21_000
  const gasPrice = await estimateGasPrice(web3)
  const balanceInWei = await web3.eth.getBalance(account.address)
  const blockNumber = await web3.eth.getBlockNumber()
  const block = await web3.eth.getBlock(blockNumber)
  const nonce = await web3.eth.getTransactionCount(account.address)

  console.log(`Sending tokens:`)
  console.log(`  Sender: ${account.address}`)
  console.log(`  Receiver: ${receiverAddress}`)
  console.log(`  Balanace: ${Web3.utils.fromWei(balanceInWei)} LYX (${balanceInWei} wei)`)
  console.log(`  Amount: ${amount} LYX (${amountInWei} wei)`)
  console.log(`  Count: ${count}`)
  console.log(`  Nonce: ${nonce}`)
  console.log(`  No Wait: ${noWait === true}`)
  console.log(`  Gas Limit: ${gasLimit}`)
  console.log(`  Gas Price: ${Web3.utils.fromWei(gasPrice)} (${gasPrice} wei)`)

  const transactions = []
  for (let i = 1; i <= count; i++) {
    console.log(`Sending transaction: #${i}`)
    const transaction = web3.eth.sendTransaction({
      from: account.address,
      to: receiverAddress,
      data: '0x',
      value: amountInWei,
      gas: gasLimit,
      maxPriorityFeePerGas: gasPrice,
      maxFeePerGas: gasPrice.add(Web3.utils.toBN((block.baseFeePerGas ?? '7'))),
      nonce: nonce + i - 1,
    })
    transactions.push(transaction)
    if (!noWait) {
      await transaction
    }
  }

  console.log('Waiting for remaining transactions to complete')
  await Promise.all(transactions)
}

const main = async () => {
  const args = yargs
    .command('send [receiverAddress] [amount]', 'Network RPC url', {
      receiverAddress: {
        type: 'string',
      },
      amount: {
        type: 'number',
        default: 1,
      }
    })
    .option('rpcUrl', {
      description: 'Network RPC url',
      type: 'string',
    })
    .option('account', {
      description: 'Private key of account',
      type: 'string',
    })
    .option('count', {
      description: 'Number of transactions to send',
      type: 'number',
      default: 1,
    })
    .option('noWait', {
      description: 'Do not wait for each transaction to be mined',
      type: 'boolean',
      default: false,
    })
    .demandOption(['rpcUrl', 'account'])
    .demandCommand(1)
    .help()
    .alias('help', 'h')
    .parse()

  const web3 = new Web3(args.rpcUrl)
  const account = web3.eth.accounts.wallet.add(args.account)

  console.log(`Network RPC URL: ${args.rpcUrl}`)
  console.log(`Actor: ${account.address}`)

  if (args._.includes('send')) {
    await send({
      web3,
      account,
      receiverAddress: args.receiverAddress ?? account.address,
      count: args.count,
      amount: Web3.utils.toBN(args.amount),
      noWait: args.noWait,
    })
  }
}

main().catch(e => console.error(e))
