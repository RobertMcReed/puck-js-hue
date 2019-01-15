const nodeHue = require('node-hue-api');
const { log, json } = require('./util');

const { HueApi } = nodeHue;

// create a light state for hue api
const createState = () => nodeHue.lightState.create();

// identify which action to perform based on the advertisement
const decodeAdvert = (lastAdvertising = '', currentAdvertising) => {
  const [lastKey, lastToggle, lastBrightness] = lastAdvertising.split('-');
  const [key, toggle, brightness] = currentAdvertising.split('-');
  const first = !lastKey;
  const decoded = {
    key,
    first,
    toggle: (!first && (lastToggle !== toggle)),
    group: (!first && (lastKey !== key)),
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
  async getLights() {
    const lights = await this.api.lights();
    return json(lights);
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

  // get the list of all groups connected to the bridge (including id for turning on/off)
  async getGroups(display = false) {
    const groups = await this.api.groups();

    return display ? json(groups) : groups;
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

  async toggleGroup({ key: groupNum, status, alert = false }) {
    const { on, name } = status || await this.getGroupStatus(groupNum);

    if (on) this.turnOffGroup(groupNum);
    else this.turnOnGroup(groupNum);

    if (alert) log.info(`${name} turned ${on ? 'off' : 'on'}.`);
  }

  async toggleGroupBrightness({ key: groupNum, status, alert = false }) {
    const { on, name, brightness } = status || await this.getGroupStatus(groupNum);

    if (!on) return null;

    const newBrightness = getNextBrightness(brightness);
    const state = createState().brightness(newBrightness);
    await this.api.setGroupLightState(groupNum, state);

    if (alert) log.info(`${name} set to ${newBrightness}% brightness.`);

    return newBrightness;
  }

  // Change rooms if keys are different, otherwise toggle lights
  handlePuckClick(alert) {
    return async (lastAdvertising, currentAdvertising) => {
      const {
        key,
        first,
        group,
        toggle,
        brightness,
      } = decodeAdvert(lastAdvertising, currentAdvertising);

      const status = await this.getGroupStatus(key);
      const {
        on,
        name,
        brightness: currBrightness,
      } = status;

      if (first) {
        log.info(`Puck found. Currently set to ${name}.`);
        log.info(`Lights are currently ${on ? `set to ${currBrightness}%` : 'off'}.`);
      } else if (toggle) {
        this.toggleGroup({ key, status, alert });
        log.info(`Turning ${on ? 'off' : 'on'} ${name}.`);
      } else if (group) {
        log.info(`Setting Puck to ${name}.`);
        log.info(`Lights are currently ${on ? `set to ${currBrightness}%` : 'off'}.`);
      } else if (brightness) {
        const newBrightness = await this.toggleGroupBrightness({ key, status, alert });
        if (newBrightness) log.info(`Changing brightness in ${name} to ${newBrightness}.`);
      }
    };
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
