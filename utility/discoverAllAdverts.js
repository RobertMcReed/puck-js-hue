const { checkBluetooth, log } = require('../lib/util');

const onDiscovery = (peripheral) => {
  // peripheral.rssi                             - signal strength
  // peripheral.address                          - MAC address
  // peripheral.advertisement.localName          - device's name
  // peripheral.advertisement.manufacturerData   - manufacturer-specific data
  // peripheral.advertisement.serviceData        - normal advertisement service data
  // ignore devices with no manufacturer data
  if (!peripheral.advertisement.manufacturerData) return;
  // output what we have
  log.info(
    peripheral.address,
    JSON.stringify(peripheral.advertisement.localName),
    JSON.stringify(peripheral.advertisement.manufacturerData),
  );
};

const discoverAllAdverts = () => {
  const noble = require('noble');

  noble.on('stateChange', (bluetoothState) => {
    checkBluetooth(bluetoothState);

    log.info('Starting scan...');
    noble.startScanning([], true);
  });

  noble.on('discover', onDiscovery);
};

if (!module.parent) discoverAllAdverts();
