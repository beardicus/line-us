const LineUs = require('../index.js')
const bot = new LineUs()

const count = 10

bot.on('connected', async () => {
  for (i = 0; i < count; i++) {
    bot.moveTo(randomPoint())
    bot.lineTo(randomPoint())
    bot.lineTo(randomPoint())
  }

  await bot.home()

  console.log('done!')
  process.exit(0)
})

function randomPoint() {
  return { x: randomNum(1125), y: randomNum(2000) }
}

function randomNum(limit) {
  return Math.random() * limit
}
