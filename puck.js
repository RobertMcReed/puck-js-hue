const noble = require('noble');

class Puck {
  constructor(handleClick) {
    // List of allowed devices
    const { PUCKS } = process.env;
    this.pucks = (PUCKS ? PUCKS.split(',') : []);

    // last advertising data received for each Puck
    this.lastAdvertising = {};
    this.handleClick = handleClick;
    this.discoverPucks = this.discoverPucks.bind(this);
    this.handlePuckAdvertising = this.handlePuckAdvertising.bind(this);
  }

  discoverPucks(peripheral) {
    // peripheral.rssi                                                  - signal strength
    // peripheral.address                                               - MAC address
    // peripheral.advertisement.localName                               - device's name
    // peripheral.advertisement.manufacturerData                        - manufacturer-specific data
    // peripheral.advertisement.serviceData                             - normal advertisement service data
    // peripheral.advertisement.manufacturerData.slice(2).toString()    - user advertised data
    
    // ignore devices with no manufacturer data
    if (!peripheral.advertisement.manufacturerData) return;

    // only listen for Pucks
    const { localName } = peripheral.advertisement;
    if (!(localName && localName.includes('Puck.js'))) return;

    // display info from found puck
    console.log('MAC Address:',
      peripheral.address,
      'Device Name:',
      localName,
      'Data:',
      peripheral.advertisement.manufacturerData.slice(2).toString(),
    );
  }

  handlePuckAdvertising(peripheral) {
    // are we listening for this Puck?
    if (!this.pucks.includes(peripheral.address)) return;
  
    // does it have manufacturer data with Puck's UUID?
    if (!peripheral.advertisement.manufacturerData ||
        peripheral.advertisement.manufacturerData[0]!=0x90 ||
        peripheral.advertisement.manufacturerData[1]!=0x05) return;
  
    // get the newly advertised message from this Puck
    const currentAdvertising = peripheral.advertisement.manufacturerData.slice(2).toString();
  
    // get the previously advertised message by this Puck
    const lastAdvertising = this.lastAdvertising[peripheral.address];

    // if the advertisement has changed, pass the data to the handler
    if (lastAdvertising && lastAdvertising !== currentAdvertising) {
      this.handleClick(lastAdvertising, currentAdvertising);
    }
  
    // update the last advertisement
    this.lastAdvertising[peripheral.address] = currentAdvertising;
  }

  init() {
    noble.on('stateChange',  (state) => {
      if (state != "poweredOn") return;

      noble.startScanning([], true);
    });

    noble.on('discover', this.pucks.length ? this.handlePuckAdvertising : this.discoverPucks);

    noble.on('scanStart', function() { console.log("[INFO] Listening for Puck.js clicks"); });

    noble.on('scanStop', function() { console.log("[INFO] Scanning stopped.");});
  }
}

module.exports = Puck;
