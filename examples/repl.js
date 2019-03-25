const readline = require('readline')
const LineUs = require('../index.js')

console.log('LineUs REPL Example')
process.stdout.write('Connecting... ')

// pass your Line-us's name as an arg on the command line
// `node repl.js my-robot-name`
const name = process.argv[2] || 'line-us'

const bot = new LineUs({ url: `ws://${name}.local` })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: name + '> ',
})

bot.on('connected', () => {
  console.log('done')
  rl.prompt()
})

bot.on('disconnected', () => {
  console.log('Connection closed')
  process.exit(0)
})

bot.on('error', (err) => {
  console.log('Connection error: ' + JSON.stringify(err))
})

rl.on('line', async (line) => {
  switch (line.trim()) {
    case 'exit':
    case 'quit':
      quit()
    default:
      // type in LineUs methods such as moveTo({x: 100})
      // and they will be evaluated
      try {
        const result = await eval('bot.' + line.trim())
        console.log(result)
      } catch (e) {
        console.log('Error: ' + e)
      }
      rl.prompt()
  }
})

rl.on('close', () => {
  // CTRL+D will also exit
  quit()
})

function quit() {
  bot.disconnect()
  process.exit(0)
}
