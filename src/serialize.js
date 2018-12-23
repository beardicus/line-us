module.exports = serialize

function serialize(cmd) {
  const gcode = cmd.g.toUpperCase()
  let params = []

  if (cmd.params) {
    params = Object.entries(cmd.params).map((param) => {
      const [key, value] = param
      return [key.toUpperCase(), value].join('')
    })
  }

  return [gcode, ...params].join(' ')
}
