'use strict';

require('dotenv').load();
const log = require('./lib/log');
const updateEnv = require('./lib/updateEnv');
const { registerDevice: registerDeviceWithHue } = require('./lib/hue');

const catchError = ({ message }) => {
  log.err(message);

  if (message.includes('link button not pressed')) {
    log.br();
    log.env('Press the link button on your bridge and try again.');
  }
};

const getDeviceName = () => {
  let deviceName = '';

  const checkArgs = (arg, i, args) => {
    if (arg.includes('registerDevice.js')) {
      deviceName = args.slice(i + 1).join(' ');

      return true;
    }
  };

  Array.from(process.argv).some(checkArgs);

  return deviceName;
};

const registerDevice = async () => {
  const deviceName = (
    getDeviceName() || 
    `Phillips Hue node.js project ${String(Math.random()).slice(2, 5)}`
  );
  
  const username = await registerDeviceWithHue(deviceName).catch(catchError);
  
  if (username) {
    log.info(`Device Name: ${deviceName}`);
    updateEnv({ key: 'HUE_USERNAME', value: username, overwrite: false });
  }
};

registerDevice();
