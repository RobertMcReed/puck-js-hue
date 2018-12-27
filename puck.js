const noble = require('noble');

class Puck {
  constructor(handleClick) {
    // List of allowed devices
    const { PUCKS } = process.env
    this.pucks = PUCKS ? PUCKS.split(',') : []

    // last advertising data received
    this.lastAdvertising = {}
    this.handleClick = handleClick
    this.discoverPucks = this.discoverPucks.bind(this)
    this.handlePuck = this.handlePuck.bind(this)
  }

  discoverPucks(peripheral) {
    // peripheral.rssi                             - signal strength
    // peripheral.address                          - MAC address
    // peripheral.advertisement.localName          - device's name
    // peripheral.advertisement.manufacturerData   - manufacturer-specific data
    // peripheral.advertisement.serviceData        - normal advertisement service data
    // ignore devices with no manufacturer data

    if (!peripheral.advertisement.manufacturerData) return;

    const localName = peripheral.advertisement.localName
    if (!(localName && localName.includes('Puck.js'))) return;

    // output what we have

    console.log('MAC Address:',
      peripheral.address,
      'Device Name:',
      localName
    );
  }

  handlePuck(peripheral) {
    // do we know this device?
    if (!this.pucks.includes(peripheral.address)) return;
  
    // does it have manufacturer data with Espruino/Puck.js's UUID
    if (!peripheral.advertisement.manufacturerData ||
        peripheral.advertisement.manufacturerData[0]!=0x90 ||
        peripheral.advertisement.manufacturerData[1]!=0x05) return;
  
    // get just our data
    const data = peripheral.advertisement.manufacturerData.slice(2)
  
    // check for changed services
    const lastAdvertising = this.lastAdvertising[peripheral.address]

    if (lastAdvertising && lastAdvertising != data.toString()) {
      this.handleClick(peripheral.address, data);
    }
  
    this.lastAdvertising[peripheral.address] = data;
  }

  init() {
    noble.on('stateChange',  function(state) {
      if (state != "poweredOn") return;

      noble.startScanning([], true);
    });

    noble.on('discover', this.pucks.length ? this.handlePuck : this.discoverPucks);

    noble.on('scanStart', function() { console.log("[INFO] Scanning started."); });

    noble.on('scanStop', function() { console.log("[INFO] Scanning stopped.");});
  }
}

module.exports = Puck;
