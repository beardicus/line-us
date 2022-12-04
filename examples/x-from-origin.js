const LineUs = require('../index.js')
const bot = new LineUs()

bot.on('connected', async () => {
  const commands = [
    // draw an 'X' and go home
    bot.moveTo({ x: 0, y: 0 }),
    bot.lineTo({ x: 500, y: 500 }),
    bot.moveTo({ x: 500, y: 0 }),
    bot.lineTo({ x: 0, y: 500 }),
    bot.home(),
  ]

  await Promise.all(commands)

  console.log('done!')
  await bot.disconnect()
  process.exit(0)
})

bot.on('coordinates', (xyz) => {
  console.log('current coordinates: ' + JSON.stringify(xyz))
})
