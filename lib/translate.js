module.exports = { translate, untranslate }

// translates a decent coordinate system into Line-us machine coordinates
// origin (0,0) is top left
// w: 1125
// h: 2000

function translate(input) {
  const { x, y, z } = input
  let coords = {}

  if (x !== undefined) {
    coords.x = x + 650
  }

  if (y !== undefined) {
    coords.y = -y + 1000
  }

  if (z !== undefined) {
    coords.z = z
  }

  return coords
}

function untranslate(input) {
  const { x, y, z } = input

  // Line-us always provides all 3 axis, so no checks
  return {
    x: x - 650,
    y: 1000 - y,
    z: z,
  }
}
