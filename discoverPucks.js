'use strict';

require('dotenv').load();
const Puck = require('./lib/puck');
const updateEnv = require('./lib/updateEnv');

const handleNewPuck = (pucks) => {
  updateEnv({ key: 'PUCKS', value: pucks, overwrite: true });
}

const discoverPucks = () => (new Puck({ handleNewPuck }));

if (!module.parent) discoverPucks();
