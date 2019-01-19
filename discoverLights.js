require('dotenv').load();
const fs = require('fs-extra');
const { log } = require('./lib/util');
const { initHueProm } = require('./lib/hue');

const discoverLights = async () => {
  if (!process.env.HUE_USERNAME) {
    log.err('You must run registerDevice.js before discoverLights.js');
    return;
  }

  const hue = await initHueProm();
  log.info('Discovering lights...');
  const lights = await hue.getLightsAndGroups();
  log.info('Writing results to hue.json...');
  await fs.writeJson('hue.json', lights, { spaces: 2 });
  log.info('Success!');
};

if (!module.parent) discoverLights();
