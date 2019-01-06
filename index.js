require('dotenv').load();

const { init: initHueProm } = require('./hue');
const Puck = require('./puck');

const main = async () => {
  const hue = await initHueProm();
  const printStatus = true;
  const puck = new Puck(hue.handlePuckClick(printStatus));
  puck.init();
}

const discovery = () => {
  console.log('[INFO] Searching for Pucks.');
  const puck = new Puck();
  puck.init();
}

// If Puck address is known, run the main program. Otherwise, discover nearby Pucks.
process.env.PUCKS ? main() : discovery();
