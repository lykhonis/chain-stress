const Web3 = require('web3')
const yargs = require('yargs')

const send = async ({
  web3,
  account,
  receiverAddress,
  count,
  amount,
  wait,
}) => {
  const amountInWei = Web3.utils.toWei(amount, 'ether')
  const gasLimit = 21_000
  const gasPrice = Web3.utils.toBN((await web3.eth.getGasPrice()) ?? '7')

  console.log(`Sending tokens:`)
  console.log(`  Sender: ${account.address}`)
  console.log(`  Receiver: ${receiverAddress}`)
  console.log(`  Amount: ${amount} (${amountInWei} wei)`)
  console.log(`  Count: ${count}`)
  console.log(`  Wait: ${wait === true}`)
  console.log(`  Gas Limit: ${gasLimit}`)
  console.log(`  Gas Price: ${Web3.utils.fromWei(gasPrice)} (${gasPrice} wei)`)

  for (let i = 1; i <= count; i++) {
    console.log(`Sending transaction: #${i}`)
    const transaction = web3.eth.sendTransaction({
      from: account.address,
      to: receiverAddress,
      data: '0x',
      value: amountInWei,
      gas: gasLimit,
      gasPrice,
    })
    if (wait) {
      await transaction
    }
  }
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
    .option('wait', {
      description: 'Wait for each transaction to be mined',
      type: 'boolean',
      default: true,
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
      wait: args.wait,
    })
  }
}

main().catch(e => console.error(e))
