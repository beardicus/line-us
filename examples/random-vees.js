const LineUs = require('../index.js')
const bot = new LineUs()

let lines = []

for (i = 0; i < 10; i++) {
  lines.push([randoPoint(), randoPoint(), randoPoint()])
}

bot.on('connected', async () => {
  let commands = lines.map((line) => {
    bot.moveTo(line[0])
    bot.lineTo(line[1])
    bot.lineTo(line[2])
  })
  commands.push(bot.home())

  await Promise.all(commands)

  console.log('done!')
  process.exit(0)
})

function randoPoint() {
  return { x: randoNum(1125), y: randoNum(2000) }
}

function randoNum(limit) {
  return Math.random() * limit
}
