const nodeHue = require('node-hue-api')
const HueApi = nodeHue.HueApi

const { USERNAME } = process.env

class Hue {
  constructor(ip) {
    this.ip = ip
    this.api = new HueApi(ip, USERNAME)
  }
  
  async login() {
    const { ipaddress } = await this.api.config()
  
    if (ipaddress !== this.ip) throw new Error('[ERROR] __LOGIN_FAILED__')
    else console.log(this.ip)
  }

  async getState() {
    const state = await this.api.getFullState()
    json(state);
  }

  async getLights() {
    const lights = await this.api.lights()
    json(lights)
  }

  async turnOnLight(lightNum, brightness) {
    let state = createState().on()
    if (brightness) state = state.brightness(brightness)

    await this.api.setLightState(lightNum, state)
  }

  async turnOffLight(lightNum) {
    let state = createState().off()

    await this.api.setLightState(lightNum, state)
  }

  async toggleLight(lightNum) {
    const { state: { on } } = await this.api.lightStatus(lightNum)

    if(on) this.turnOffLight(lightNum)
    else this.turnOnLight(lightNum)
  }

  async getGroups(display = false) {
    const groups = await this.api.groups()
    if(display) json(groups)

    return groups
  }

  async getGroupStatus(groupNum) {
    const groups = await this.getGroups()
    const group = groups[groupNum]
    const status = group.state.any_on
    const name = group.name

    return { on: status, name }
  }

  async turnOnGroup(groupNum, brightness) {
    let state = createState().on()
    if (brightness) state = state.brightness(brightness)

    await this.api.setGroupLightState(groupNum, state)
  }

  async turnOffGroup(groupNum) {
    let state = createState().off()
    
    await this.api.setGroupLightState(groupNum, state)
  }

  async toggleGroup(groupNum, alert = false) {
    const { on, name } = await this.getGroupStatus(groupNum)

    if(on) this.turnOffGroup(groupNum)
    else this.turnOnGroup(groupNum)

    if(alert) console.log(`[INFO] ${name} turned ${on ? 'off' : 'on'}`)
  }
  
  toggleGroupBound(groupNum, alert) {
    return () => this.toggleGroup(groupNum, alert)
  }
}


const getBridgeIp = async () => {
  const bridges = await nodeHue.nupnpSearch()
  const { ipaddress: ip } = bridges[0]

  return ip
}

function json(result) {
  console.log(JSON.stringify(result, null, 2))
}

function createState() {
  return nodeHue.lightState.create()
}

const init = async () => {
  const ip = await getBridgeIp()
  const hue = new Hue(ip)
  await hue.login()

  return hue
}

module.exports = { init }
