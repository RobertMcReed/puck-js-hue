const log = require('./log');

class Puck {
  constructor({ handleClick, handleNewPuck }) {
    this.noble = require('noble');

    // List of allowed devices
    const { PUCKS } = process.env;
    this.pucks = (PUCKS ? PUCKS.split(',') : []);

    // last advertising data received for each Puck
    this.lastAdvertising = {};
    this.handleClick = handleClick;
    this.handleNewPuck = handleNewPuck;
    this.onStateChange = this.onStateChange.bind(this);
    this.discoverPucks = this.discoverPucks.bind(this);
    this.handlePuckAdvertising = this.handlePuckAdvertising.bind(this);

    this.onDiscover = (
      (this.handleNewPuck || !this.pucks.length)
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
    log.br();
    log.info(`Found ${known ? 'KNOWN' : 'NEW'} Puck`);
    log.info('Name:', localName);
    log.info('Address:', address);
    log.info('Advertisement:', data.slice(2).toString());

    if (!known) {
      this.pucks.push(address);

      if (this.handleNewPuck) this.handleNewPuck(this.pucks.join(','));
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
      log.err('bluetooth state:', bluetoothState);

      if (bluetoothState === 'poweredOff') {
        log.err('Bluetooth is not enabled. Please enable bluetooth before continuing.');
      }
      
      process.exit();
    }

    this.noble.startScanning([], true);
  }

  init() {
    this.noble.on('stateChange', this.onStateChange);

    this.noble.on('discover', this.onDiscover);

    this.noble.on('scanStart', () => log.info('Listening for Puck.js advertisements.'));

    this.noble.on('scanStop', () => log.info('Scanning stopped.'));
  }
}

module.exports = Puck;
