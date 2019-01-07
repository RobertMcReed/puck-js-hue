const nodeHue = require('node-hue-api');
const HueApi = nodeHue.HueApi;

const { USERNAME } = process.env;

class Hue {
  constructor(ip) {
    this.ip = ip;
    this.api = new HueApi(ip, USERNAME);
  }

  // press bridge link button before running this method
  async registerDevice(deviceDescription) {
    const username = await this.api.registerUser(this.ip, deviceDescription);
    console.log('[INFO] Device registered successfully.');
    console.log('[INFO] Username:', username);
    console.log(`\nAdd USERNAME=${username} to your .env file to use the HUE API.`);
  }
  
  // ensure that we can connect to HUE
  async login() {
    const { ipaddress: ip } = await this.api.config();
  
    if (ip !== this.ip) {
      console.log('[ERROR] Could not reach HUE.')
      console.log('Ensure that you have registered this device with HUE bridge and have your USERNAME set as an environment variable.');
      process.exit();
    } else console.log('[INFO] Connected to HUE.');
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

    if(alert) console.log(`[INFO] ${name} turned ${on ? 'off' : 'on'}.`);
  }

  // Change rooms if keys are different, otherwise toggle lights
  handlePuckClick(alert) {
    return async (lastAdvertising, currentAdvertising) => {
      const lastKey = getRoomKey(lastAdvertising);
      const currKey = getRoomKey(currentAdvertising);
  
      if (lastKey === currKey) { // If the keys are the same, we are toggling the lights
        this.toggleGroup(currKey, alert);
      } else { // either first advert or a room switch
        const { on, name } = await this.getGroupStatus(currKey);
        const lightStatus = `Lights are currently ${on ? 'on' : 'off'}.`;
        const firstMessage = `found. Currently set`;
        const switchMessage = `switching`;

        console.log(`[INFO] Puck ${lastKey ? switchMessage : firstMessage} to ${name}.`);
        console.log(`[INFO] ${lightStatus}`);
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
function getRoomKey(advertising='') {
  return advertising.split('-')[0];
}

// get the ip of the bridge and instantiate a Hue
const getHue = async () => {
  const ip = await getBridgeIp();
  const hue = new Hue(ip);

  return hue;
};

// instantiate a complete hue instance
const init = async () => {
  const hue = getHue();
  await hue.login();

  return hue;
};

const registerDevice = async (deviceDescription) => {
  const hue = await getHue();
  await hue.registerDevice(deviceDescription);
};

module.exports = { init, registerDevice };
