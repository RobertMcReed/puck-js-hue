require('dotenv').load();

const { init: initHueProm } = require('./hue');
const Puck = require('./puck');

const main = async () => {
  const hue = await initHueProm();
  const printStatus = true;
  const puck = new Puck(hue.handlePuckClick(printStatus));
  puck.init();
}

// If Puck address is known, run the main program. Otherwise, discover nearby Pucks.
if (process.env.PUCKS) main();
else (new Puck()).init();
