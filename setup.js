require('dotenv').load();
const shell = require('shelljs');

const { log: { br, info, err } } = require('./lib/util');

const { PUCKS, HUE_USERNAME } = process.env;

const exec = (command) => {
  const { code } = shell.exec(command, { silent: true });

  return code;
};

const handleCode = (code, success, fail) => {
  if (code) {
    br();
    err(fail);
    process.exit(code);
  } else {
    info(success);
  }
};

const pause = sec => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, sec * 1000);
});

const setup = async () => {
  br();
  info('Initializing setup...');
  br();

  // registerDevice
  if (!HUE_USERNAME) {
    info('Ensure you have pressed the "Link" button on your hue bridge.');
    info('Setup will begin in 5 seconds...');
    await pause(5);

    br();
    info('Attempting to register your device with Hue Bridge...');
    handleCode(
      exec('node registerDevice.js'),
      'Device registered successfully! HUE_USERNAME written to .env.',
      'Could not register device. Ensure you are on the same network as the Hue Bridge, have pressed the link button within the last 30 seconds, and then try again.',
    );
  } else {
    info('HUE_USERNAME found in .env. Skipping device register.');
  }

  // discoverPucks
  br();
  if (!PUCKS) {
    info('Searching for a Puck within range...');
    handleCode(
      exec('node discoverPucks.js --first --timeout'),
      'Puck found and added to .env!',
      'No new Puck found. Make sure your device is powered on, within range, and not connected to any other devices and then try again.',
    );
  } else {
    info('PUCKS already found in .env. Not searching for new ones.');
  }

  // discoverLights
  br();
  info('Searching for your Hue Lights and Light Groups...');
  handleCode(
    exec('node discoverLights.js'),
    'Lights and Light Groups saved to hue.json.',
    'Something went wrong. Check your network connection, Hue bridge, and then try again.',
  );

  // prepPuck
  br();
  info('Preparing Espruino code...');
  handleCode(
    exec('node prepPuck.js --save'),
    'Default config saved to config.json and Espruino code saved to espruino/puck-advertise-hue.js',
    'Something went wrong. Check your network connection, Hue bridge, and then try again.',
  );

  // flashPuck
  br();
  info('Attempting to send Espruino code to Puck...');
  let success = false;

  for (let i = 0; i < 10; i++) {
    const code = exec('node flashPuck.js');

    if (code) {
      if (i < 10) {
        err('Flash failed, trying again...');
        await pause(5);
      }
    } else {
      success = true;
      break;
    }
  }

  if (success) {
    br();
    info('Success! You are now ready to use Puck to control your Hue lights!');
    br();
    info('By default, all of your light groups have been added to the Puck controller.');
    info('You can change all of the default settings by editing config.json, followed by running "node prepPuck.js" and then "node flashPuck.js".');
    br();
    info('Take a look at hue.json to see all of the lights connected to your bridge. If you want to control lights individually, simply grab them from hue.json and add them to the lights array in your config.json, and then prep and flash the puck again.');
    br();
    br();
    info('Time to test it out!');
    info('Run "node main.js" to start the script that will listen for Puck clicks.');
    info('This script must be running on a device within a reasonable proximity of your Puck for it to work.');
    info('Have fun!');
  } else {
    err('Code was not sent to your Puck, but everything else worked.');
    info('Ensure that your puck is nearby, powered on, and not connected to any devices.');
    info('Try flashing the code again by running "node flashPuck.js".');
    info('It may take a few attempts for it to send successfully, but should eventually work.');
    info('If you can\'t send it successfully, try copying the code from espruino/puck-advertise-hue.js into the Espruino Web IDE and sending it manually.');
  }
};

if (!module.parent) setup();
