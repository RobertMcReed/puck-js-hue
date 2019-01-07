const { registerDevice } = require('./hue');

const catchError = ({ message }) => {
  console.log('[ERROR]', message);

  if (message.includes('link button not pressed')) {
    console.log('\nPress the link button on your bridge and try again.');
  }
};

const getDeviceName = () => {
  let deviceName = '';

  const checkArgs = (arg, i, args) => {
    if (arg.includes('registerDevice.js')) {
      deviceName = args.slice(i + 1).join(' ');

      return true;
    }
  };

  Array.from(process.argv).some(checkArgs);

  return deviceName;
};

const main = async () => {
  const deviceName = getDeviceName() || `Phillips Hue node.js project ${String(Math.random()).slice(2, 5)}`;
  
  console.log(`[INFO] Device Name: ${deviceName}`);
  registerDevice(deviceName).catch(catchError);
};

main();
