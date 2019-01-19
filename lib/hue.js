const nodeHue = require('node-hue-api');
const autoBind = require('auto-bind');
const { log, json } = require('./util');

const { HueApi } = nodeHue;

// create a light state for hue api
const createState = () => nodeHue.lightState.create();

const cleanObj = type => ({ name, id: key }) => ({
  type,
  name,
  key,
});

// identify which action to perform based on the advertisement
const decodeAdvert = (lastAdvertising = '', currentAdvertising) => {
  const [lastKey, lastToggle, lastBrightness] = lastAdvertising.split('-');
  const [key, toggle, brightness] = currentAdvertising.split('-');
  const first = !lastKey;

  const type = key[0] === 'l' ? 'light' : 'group';
  const decoded = {
    key: key.slice(1),
    type,
    first,
    toggle: (!first && (lastToggle !== toggle)),
    change: (!first && (lastKey !== key)),
    brightness: (!first && (lastBrightness !== brightness)),
  };

  return decoded;
};

const getNextBrightness = (currBrightness) => {
  let brightness = 25;

  if (currBrightness < 25) brightness = 25;
  else if (currBrightness < 50) brightness = 50;
  else if (currBrightness < 75) brightness = 75;
  else if (currBrightness < 100) brightness = 100;

  return brightness;
};

class Hue {
  constructor(ip) {
    this.ip = ip;
    this.username = process.env.HUE_USERNAME;
    const args = process.env.HUE_USERNAME ? [ip, process.env.HUE_USERNAME] : [];
    this.api = new HueApi(...args);
    autoBind(this);
  }

  // register a new device with bridge
  async registerDevice(deviceDescription) {
    if (this.username) await this.api.pressLinkButton();

    const username = await this.api.registerUser(this.ip, deviceDescription);
    log.info('Device registered successfully.');
    log.info('Username:', username);

    return username;
  }

  // ensure that we can connect to HUE
  async login() {
    const { ipaddress: ip } = await this.api.config();

    if (ip !== this.ip) {
      log.err('Could not reach HUE.');
      log.info('Ensure that you have registered this device with HUE bridge and have set your HUE_USERNAME as an environment variable.');
      process.exit();
    } else log.info('Connected to HUE.');
  }

  // get the state of all devices connected to the bridge
  async getState() {
    const state = await this.api.getFullState();
    return json(state);
  }

  // get the list of all lights connected to the bridge (including id for turning on/off)
  async getLights(print = false) {
    const lights = await this.api.lights();
    return print ? json(lights) : lights;
  }

  // get the name and light status of a group
  async getLightStatus(lightNum) {
    const light = await this.lightStatus(lightNum);
    const { on, bri } = light.state;
    const brightness = Math.round(bri / 254 * 100);
    const { name } = light;

    const status = {
      on,
      name,
      brightness,
    };

    return status;
  }

  async turnOnLight(lightNum, brightness) {
    let state = createState().on();
    if (brightness) state = state.brightness(brightness);

    await this.api.setLightState(lightNum, state);
  }

  async turnOffLight(lightNum) {
    const state = createState().off();

    await this.api.setLightState(lightNum, state);
  }

  async toggleLight(lightNum) {
    const { state: { on } } = await this.api.lightStatus(lightNum);

    if (on) this.turnOffLight(lightNum);
    else this.turnOnLight(lightNum);
  }

  async toggleLightBrightness({ key: lightNum, status }) {
    const { on, brightness } = status || await this.getLightStatus(lightNum);

    const newBrightness = on ? getNextBrightness(brightness) : 25;
    const state = createState().on().brightness(newBrightness);

    await this.api.setLightState(lightNum, state);

    return newBrightness;
  }

  // get the list of all groups connected to the bridge (including id for turning on/off)
  async getGroups(print = false) {
    const groups = await this.api.groups();

    return print ? json(groups) : groups;
  }

  // get the name and light status of a group
  async getGroupStatus(groupNum) {
    const groups = await this.getGroups();
    const group = groups[groupNum];
    const on = group.state.any_on;
    const { bri } = group.action;
    const brightness = Math.round(bri / 254 * 100);
    const { name } = group;

    const status = {
      on,
      name,
      brightness,
    };

    return status;
  }

  async turnOnGroup(groupNum, brightness) {
    let state = createState().on();
    if (brightness) state = state.brightness(brightness);

    await this.api.setGroupLightState(groupNum, state);
  }

  async turnOffGroup(groupNum) {
    const state = createState().off();

    await this.api.setGroupLightState(groupNum, state);
  }

  async toggleGroup({ key: groupNum, status }) {
    const { on } = status || await this.getGroupStatus(groupNum);

    if (on) this.turnOffGroup(groupNum);
    else this.turnOnGroup(groupNum);
  }

  async toggleGroupBrightness({ key: groupNum, status }) {
    const { on, brightness } = status || await this.getGroupStatus(groupNum);

    const newBrightness = on ? getNextBrightness(brightness) : 25;
    const state = createState().on().brightness(newBrightness);

    await this.api.setGroupLightState(groupNum, state);

    return newBrightness;
  }

  async getLightsAndGroups() {
    const bulbs = await Promise.all([this.getLights(), this.getGroups()]);
    const devices = {};

    bulbs.forEach((data, i) => {
      const type = i ? 'groups' : 'lights';
      const bulbList = i ? data.slice(1) : data[type];

      const cleaned = bulbList.map(cleanObj(type.slice(0, -1)));
      devices[type] = cleaned;
    });

    return devices;
  }

  // Change rooms if keys are different, otherwise toggle lights
  async handlePuckClick(lastAdvertising, currentAdvertising) {
    const {
      key,
      type,
      first,
      change,
      toggle,
      brightness,
    } = decodeAdvert(lastAdvertising, currentAdvertising);

    const typeIsGroup = type === 'group';
    const getStatus = typeIsGroup ? this.getGroupStatus : this.getLightStatus;
    const status = await getStatus(key);
    const {
      on,
      name,
      brightness: currBrightness,
    } = status;

    if (first) {
      log.info(`Puck found. Currently set to ${name}.`);
      log.info(`Lights are currently ${on ? `set to ${currBrightness}%` : 'off'}.`);
    } else if (toggle) {
      const toggleLights = typeIsGroup
        ? this.toggleGroup
        : this.toggleLight;

      toggleLights({ key, status });
      log.info(`Turning ${on ? 'off' : 'on'} ${name}.`);
    } else if (change) {
      log.info(`Setting Puck to ${name}.`);
      log.info(`Lights are currently ${on ? `set to ${currBrightness}%` : 'off'}.`);
    } else if (brightness) {
      const toggleBrightness = typeIsGroup
        ? this.toggleGroupBrightness
        : this.toggleLightBrightness;

      const newBrightness = await toggleBrightness({ key, status });
      if (newBrightness) log.info(`Changing brightness in ${name} to ${newBrightness}.`);
    }
  }
}

// get the ip of the first bridge found
const getBridgeIp = async () => {
  const bridges = await nodeHue.nupnpSearch();
  const { ipaddress: ip } = bridges[0];

  return ip;
};

// get the ip of the bridge and instantiate a Hue
const getHue = async () => {
  const ip = await getBridgeIp();
  const hue = new Hue(ip);

  return hue;
};

// instantiate a complete hue instance
const initHueProm = async () => {
  const hue = await getHue();
  await hue.login();

  return hue;
};

const registerDevice = async (deviceDescription) => {
  const hue = await getHue();
  const username = await hue.registerDevice(deviceDescription);

  return username;
};

module.exports = { initHueProm, registerDevice, Hue };
