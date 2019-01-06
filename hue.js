const nodeHue = require('node-hue-api');
const HueApi = nodeHue.HueApi;

const { USERNAME } = process.env;

class Hue {
  constructor(ip) {
    this.ip = ip;
    this.api = new HueApi(ip, USERNAME);
  }
  
  // ensure that we can connect to HUE
  async login() {
    const { ipaddress } = await this.api.config();
  
    if (ipaddress !== this.ip) throw new Error('[ERROR] Could not reach HUE');
    else console.log('[INFO] Connected to HUE');
  }

  // get the state of all devices connected to the bridge
  async getState() {
    const state = await this.api.getFullState();
    json(state);
  }

  // get the list of all lights connected to the bridge (including id for turning on/off)
  async getLights() {
    const lights = await this.api.lights();
    json(lights);
  }

  async turnOnLight(lightNum, brightness) {
    let state = createState().on();
    if (brightness) state = state.brightness(brightness);

    await this.api.setLightState(lightNum, state);
  }

  async turnOffLight(lightNum) {
    let state = createState().off();

    await this.api.setLightState(lightNum, state);
  }

  async toggleLight(lightNum) {
    const { state: { on } } = await this.api.lightStatus(lightNum);

    if(on) this.turnOffLight(lightNum);
    else this.turnOnLight(lightNum);
  }

  // get the list of all groups connected to the bridge (including id for turning on/off)
  async getGroups(display = false) {
    const groups = await this.api.groups();
    if(display) json(groups);

    return groups;
  }

  // get the name and light status of a group
  async getGroupStatus(groupNum) {
    const groups = await this.getGroups();
    const group = groups[groupNum];
    const status = group.state.any_on;
    const name = group.name;

    return { on: status, name };
  }

  async turnOnGroup(groupNum, brightness) {
    let state = createState().on();
    if (brightness) state = state.brightness(brightness);

    await this.api.setGroupLightState(groupNum, state);
  }

  async turnOffGroup(groupNum) {
    let state = createState().off();
    
    await this.api.setGroupLightState(groupNum, state);
  }

  async toggleGroup(groupNum, alert = false) {
    const { on, name } = await this.getGroupStatus(groupNum);

    if(on) this.turnOffGroup(groupNum);
    else this.turnOnGroup(groupNum);

    if(alert) console.log(`[INFO] ${name} turned ${on ? 'off' : 'on'}`);
  }

  // Change rooms if keys are different, otherwise toggle lights
  handlePuckClick(alert) {
    return async (lastAdvertising, currentAdvertising) => {
      const lastKey = getRoomKey(lastAdvertising);
      const currKey = getRoomKey(currentAdvertising);
  
      if (lastKey === currKey) { // If the keys are the same, we are toggling the lights
        this.toggleGroup(currKey, alert);
      } else { // otherwise we are changing rooms
        const { on, name } = await this.getGroupStatus(currKey);
        console.log(`[INFO] Puck switching to ${name}. Lights are currently ${on ? 'on' : 'off'}.`);
      }
    }
  }
}

// get the ip of the first bridge found
const getBridgeIp = async () => {
  const bridges = await nodeHue.nupnpSearch();
  const { ipaddress: ip } = bridges[0];

  return ip;
};

// pretty print json
function json(result) {
  console.log(JSON.stringify(result, null, 2))
}

// create a light state for hue api
function createState() {
  return nodeHue.lightState.create()
}

// identify which room an advertising is for
function getRoomKey(advertising) {
  return advertising.split('-')[0];
}

// instantiate a complete hue instance
const init = async () => {
  const ip = await getBridgeIp();
  const hue = new Hue(ip);
  await hue.login();

  return hue;
};

module.exports = { init };
