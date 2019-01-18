require('dotenv').load();
const Puck = require('./lib/puck');
const updateEnv = require('./lib/updateEnv');

const firstOnly = process.argv.includes('--first');

const handleNewPuck = async (pucks) => {
  await updateEnv({ key: 'PUCKS', value: pucks, overwrite: true });
  if (firstOnly) process.exit();
};

const discoverPucks = () => (new Puck({ handleNewPuck }));

if (!module.parent) discoverPucks();
