require('dotenv').load();

const { init: initHueProm } = require('./lib/hue');
const Puck = require('./lib/puck');

const main = async () => {
  const hue = await initHueProm();
  const printStatus = true;
  const puck = new Puck({ handleClick: hue.handlePuckClick(printStatus) });
  puck.init();
};

const { PUCKS, USERNAME } = process.env;
let run = true;

if (!PUCKS) {
  console.log('[ERROR] You must have a comma separated list of PUCKS in a .env file at the root of the project.\n');
  console.log('[INFO] Run "node discoverPucks.js" with your Puck nearby and powered on to automatically discover and add it to your .env.\n');
  run = false;
}

if (!USERNAME) {
  console.log('[ERROR] You must have a Hue USERNAME in a .env file at the root of the project.\n');
  console.log('[INFO] Press the link button on your Hue Bridge and then run "node registerDevice.js" to automatically register your device and add it to your .env.\n');
  run = false;
}

if (run) main().catch(console.log);
