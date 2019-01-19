const esp = require('espruino');
const { join } = require('path');
const { log } = require('./lib/util');

const flashPuck = () => {
  const { PUCKS } = process.env;
  const puck = PUCKS.split(',')[0];

  if (puck) {
    const filename = join(__dirname, 'espruino', 'puck-advertise-hue.js');

    const info = console.log.bind(null, '[INFO]');
    const err = console.log.bind(null, '[ERROR]');

    let error = true;

    const map = {
      'Noble: Starting scan': 'Scanning for Pucks...',
      'BT> Connected': 'Connected to Puck!',
    };

    console.log = (arg) => {
      error = (arg !== 'Sent');

      if (map[arg]) info(map[arg]);
      else if (arg === 'Sending...') map['Sending...'] = 'Sending code...';
    };

    esp.sendFile(puck, filename, () => {
      if (error) {
        err('Failed to send code to puck.');
        info('This happens from time to time. Please run flashPuck.js again.');
      } else info('Success!');

      process.exit();
    });
  } else {
    log.err('No PUCKS in .env.');
    log.info('Run discoverPuck.js to find nearby pucks and then try again.');
  }
};

if (!module.parent) {
  require('dotenv').load();
  flashPuck();
} else module.exports = flashPuck;
