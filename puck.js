const noble = require('noble');

class Puck {
  constructor({ handleClick, handleDiscovery }) {
    // List of allowed devices
    const { PUCKS } = process.env;
    this.pucks = (PUCKS ? PUCKS.split(',') : []);

    // last advertising data received for each Puck
    this.lastAdvertising = {};
    this.handleClick = handleClick;
    this.handleDiscovery = handleDiscovery;
    this.discoverPucks = this.discoverPucks.bind(this);
    this.handlePuckAdvertising = this.handlePuckAdvertising.bind(this);

    this.onDiscover = (
      (this.handleDiscovery || !this.pucks.length)
        ? this.discoverPucks
        : this.handlePuckAdvertising
    );
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
    const { address, advertisement = {} } = peripheral;
    const { localName, manufacturerData: data } = advertisement;
    if (!(localName && localName.includes('Puck.js'))) return;

    const known = this.pucks.includes(address);

    // display info from found puck
    console.log(`\nFound ${known ? 'KNOWN' : 'NEW'} Puck`);
    console.log('Name:', localName);
    console.log('Address:', address);
    console.log('Advertisement:', data.slice(2).toString());

    if (!known) {
      this.pucks.push(address);

      if (this.handleDiscovery) this.handleDiscovery(this.pucks.join(','));
    }
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

    // if it is the first advertisement or the advertisement has changed, pass the data to the handler
    if (!lastAdvertising || lastAdvertising !== currentAdvertising) {
      this.handleClick(lastAdvertising, currentAdvertising);
    }
  
    // update the last advertisement
    this.lastAdvertising[peripheral.address] = currentAdvertising;
  }

  onStateChange(bluetoothState) {
    if (bluetoothState !== 'poweredOn') {
      console.log('[ERROR] bluetooth state:', bluetoothState);

      if (bluetoothState === 'poweredOff') {
        console.log('[ERROR] Bluetooth is not enabled. Please enable bluetooth before continuing.');
      }
      
      process.exit();
    }

    noble.startScanning([], true);
  }

  init() {
    noble.on('stateChange', this.onStateChange);

    noble.on('discover', this.onDiscover);

    noble.on('scanStart', () => console.log("[INFO] Listening for Puck.js advertisements."));

    noble.on('scanStop', () => console.log("[INFO] Scanning stopped."));
  }
}

module.exports = Puck;
