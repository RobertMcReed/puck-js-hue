const concat = (...args) => args.join('');

const info = (...args) => console.log('[INFO]', ...args);

const err = (...args) => console.error('[ERROR]', ...args);

const br = () => console.log();

const json = (result) => {
  console.log(JSON.stringify(result, null, 2));

  return result;
};

const checkBluetooth = (bluetoothState) => {
  if (bluetoothState !== 'poweredOn') {
    err('bluetooth state:', bluetoothState);

    if (bluetoothState === 'poweredOff') {
      err('Bluetooth is not enabled. Please enable bluetooth before continuing.');
    }

    process.exit(1);
  }
};

module.exports = {
  json,
  concat,
  checkBluetooth,
  log: { info, err, br },
};
