module.exports = { serialize, deserialize }

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

function deserialize(input) {
  const typeRegex = /^\w+/
  let results = {
    type: typeRegex.exec(input)[0],
    data: {},
  }

  let match = []
  const dataRegex = / (\w+):(?:([^ "]+)|"([^"]+)")/g
  while ((match = dataRegex.exec(input))) {
    results.data[match[1]] = match[2] || match[3]
  }

  return results
}
