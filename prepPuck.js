require('dotenv').load();
const fs = require('fs-extra');
const { join } = require('path');
const clipboard = require('clipboardy');
const { log, concat } = require('./lib/util');
const { initHueProm } = require('./lib/hue');

const cleanGroup = group => ({
  name: group.name,
  key: group.id,
});

const stringifyGroups = (groups) => {
  const header = 'const GROUPS = [';
  const makeRow = (acc, { name, key }) => `${acc}\n  { name: '${name}', key: ${key} },`;
  const groupRows = groups.reduce(makeRow, '');

  return concat(header, groupRows, '\n];\n');
};

const prepPuck = async () => {
  if (!process.env.HUE_USERNAME) {
    log.err('You must run registerDevice.js before prepPuck.js');
    return;
  }

  const filename = join(__dirname, 'espruino', 'puck-advertise-hue.js');
  const demarcation = '// DO NOT ADD ANYTHING ABOVE THIS LINE';
  const codeRaw = await fs.readFile(filename, 'utf-8');

  const splitCode = codeRaw.split(demarcation);
  const code = splitCode[1] || splitCode[0];
  const hue = await initHueProm();
  log.info('Fetching light groups...');
  const groups = await hue.getGroups();
  const cleanedGroups = groups.slice(1).map(cleanGroup);
  const stringGroups = stringifyGroups(cleanedGroups);
  const formattedCode = concat(stringGroups, demarcation, code);
  log.info('Adding GROUPS array to espruino/puck-advertise-hue.js...');

  await fs.writeFile(filename, formattedCode);
  log.info('Copying Espruino code to your clipboard...');
  const cleanedCode = formattedCode.replace(/ \/\/ eslint.*$/gm, '');
  await clipboard.write(cleanedCode);
  log.info('Success. Paste the code into the Espruino Web IDE and flash it to your Puck.js.');
};

if (!module.parent) prepPuck();
