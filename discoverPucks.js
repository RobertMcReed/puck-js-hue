require('dotenv').load();
const Puck = require('./puck');
const updateEnv = require('./updateEnv');

const handleNewPuck = (pucks) => {
  updateEnv({ key: 'PUCKS', value: pucks, overwrite: true });
}

const discoverPucks = () => {
  const puck = new Puck({ handleNewPuck });
  puck.init();
};

discoverPucks();
