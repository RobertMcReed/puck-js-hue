require('dotenv').load();
const Puck = require('./lib/puck');
const updateEnv = require('./lib/updateEnv');

const firstOnly = process.argv.includes('--first');
const timeout = process.argv.indexOf('--timeout');

const handleNewPuck = async (pucks) => {
  await updateEnv({ key: 'PUCKS', value: pucks, overwrite: true });
  if (firstOnly) process.exit(0);
};

const discoverPucks = () => {
  if (timeout > -1) {
    const sec = process.argv[timeout + 1] || 30;

    setTimeout(() => {
      process.exit(1);
    }, sec * 1000);
  }

  return (new Puck({ handleNewPuck }));
};

if (!module.parent) discoverPucks();
