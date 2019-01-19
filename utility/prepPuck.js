require('dotenv').load();
const fs = require('fs-extra');
const { join } = require('path');
const { log, concat } = require('../lib/util');
const { initHueProm } = require('../lib/hue');

const stringifyLights = (lights) => {
  const header = 'const LIGHTS = [';
  const makeRow = (acc, { name, key, type }) => `${acc}\n  { type: '${type}', name: '${name}', key: ${key} },`;
  const lightRows = lights.reduce(makeRow, '');

  return concat(header, lightRows, '\n];\n');
};

const readFile = async (path, json) => {
  try {
    const file = await (!json
      ? fs.readFile(path, 'utf-8')
      : fs.readJson(path)
    );

    return file;
  } catch (e) {
    return null;
  }
};

const readFiles = async () => {
  const templatePath = join(__dirname, '..', 'espruino', 'puck-advertise-hue-template.js');
  const defaultConfigPath = join(__dirname, '..', 'espruino', 'config-default.json');
  const userConfigPath = join(__dirname, '..', 'config.json');

  const files = await Promise.all([
    readFile(templatePath),
    readFile(defaultConfigPath, true),
    readFile(userConfigPath, true),
  ]);

  return files;
};

const deepCopy = obj => JSON.parse(JSON.stringify(obj));

const copyAttributes = (destination, source) => {
  if (source) {
    Object.keys(source).forEach((key) => {
      destination[key] = source[key];
    });
  }
};

const mergeConfigs = (defaultConfig, userConfig) => {
  const merged = deepCopy(defaultConfig);

  if (userConfig) {
    copyAttributes(merged.clickDuration, userConfig.clickDuration);

    if (userConfig.modes) {
      Object.keys(defaultConfig.modes).forEach((mode) => {
        if (userConfig.modes[mode]) {
          copyAttributes(merged.modes[mode], userConfig.modes[mode]);
        }
      });
    }

    if (userConfig.lights) merged.lights = userConfig.lights;
  }

  return merged;
};

const getOrder = (mode) => {
  let order = null;
  const type = mode.clickType;

  switch (type) {
    case 'short':
      order = 0;
      break;
    case 'medium':
      order = 1;
      break;
    default:
      order = 2;
      break;
  }

  return order;
};

const stringifyArray = array => JSON.stringify(array)
  .replace(/"/g, '\'')
  .replace(/,/g, ', ');

const formatSettings = (settings) => {
  const {
    clickDuration: {
      timeout,
      short,
      medium,
    },
    modes: {
      changeBrightness,
      toggleOnOff,
      selectLights,
    },
  } = settings;

  const handlers = [];
  handlers[getOrder(changeBrightness)] = 'handleChangeBrightness';
  handlers[getOrder(toggleOnOff)] = 'handleToggleLights';
  handlers[getOrder(selectLights)] = 'handleChangeLights';

  const lines = [
    `const SHORT_MAX = ${short};`,
    `const MEDIUM_MAX = ${medium};`,
    `const CHANGE_DELAY = ${selectLights.delay};`,
    `const TIMEOUT = ${timeout};`,
    `const BRIGHTNESS_COLORS = ${stringifyArray(changeBrightness.colors)};`,
    `const CHANGE_COLORS = ${stringifyArray(selectLights.colors)};`,
    `const TOGGLE_COLORS = ${stringifyArray(toggleOnOff.colors)};`,
    `const HANDLERS = ${stringifyArray(handlers)};`,
  ];

  return `${lines.join('\n')}\n`;
};

const prepPuck = async () => {
  if (!process.env.HUE_USERNAME) {
    log.err('You must run registerDevice.js before prepPuck.js');
    return;
  }

  const [codeRaw, defaultConfig, userConfig] = await readFiles();

  const START = '// CONFIG BEGIN\n';
  const STOP = '// CONFIG END\n';

  const cleanedCode = codeRaw.replace(/ \/\/ eslint.*$/gm, '');
  const splitCode = cleanedCode.split(STOP);
  const code = splitCode[1] || splitCode[0];

  const settings = mergeConfigs(defaultConfig, userConfig);

  if (!userConfig || !userConfig.lights) {
    const hue = await initHueProm();
    log.info('Fetching light groups...');
    const bulbs = await hue.getLightsAndGroups();
    const { groups } = bulbs;
    log.info('Adding light groups to your configuration...');
    settings.lights = groups;
  }

  if (process.argv.includes('--save')) {
    log.info('Writing your config to config.json...');
    await fs.writeJson(`${__dirname}/../config.json`, settings, { spaces: 2 });
  }

  const formattedSettings = formatSettings(settings);
  const stringGroups = stringifyLights(settings.lights);
  const eslint = '/* eslint-disable */\n';
  const formattedCode = concat(eslint, START, formattedSettings, stringGroups, STOP, code);
  log.info('Writing config settings to espruino/puck-advertise-hue.js...');

  const filename = join(__dirname, '..', 'espruino', 'puck-advertise-hue.js');
  await fs.writeFile(filename, formattedCode);
  log.info('Success!');
};

if (!module.parent) {
  prepPuck()
    .catch((e) => {
      console.log(e);
      process.exit(1);
    });
}
