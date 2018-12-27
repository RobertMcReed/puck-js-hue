require('dotenv').load()

const { init: initHueProm } = require('./hue')
const Puck = require('./puck')

const main = async (lightGroup = 1) => {
  const hue = await initHueProm()
  const puck = new Puck(hue.toggleGroupBound(lightGroup, true))
  puck.init()
}

if (process.env.PUCKS) main(2)
else (new Puck()).init()
