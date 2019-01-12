'use strict';

const onDiscovery = (peripheral) => {
  // peripheral.rssi                             - signal strength
  // peripheral.address                          - MAC address
  // peripheral.advertisement.localName          - device's name
  // peripheral.advertisement.manufacturerData   - manufacturer-specific data
  // peripheral.advertisement.serviceData        - normal advertisement service data
  // ignore devices with no manufacturer data
  if (!peripheral.advertisement.manufacturerData) return;
  // output what we have
  console.log(
    peripheral.address,
    JSON.stringify(peripheral.advertisement.localName),
    JSON.stringify(peripheral.advertisement.manufacturerData)
  );
};

const discoverAllPucks = () => {
  const noble = require('noble');

  noble.on('stateChange',  function(state) {
    if (state!="poweredOn") return;
    console.log("Starting scan...");
    noble.startScanning([], true);
  });
  noble.on('discover', onDiscovery);
  noble.on('scanStart', function() { console.log("Scanning started."); });
  noble.on('scanStop', function() { console.log("Scanning stopped.");});
};

if (!module.parent) discoverAllPucks();
