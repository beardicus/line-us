module.exports = deserialize

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
