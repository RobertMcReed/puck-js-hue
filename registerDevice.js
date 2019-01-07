require('dotenv').load();
const fs = require('fs');
const { registerDevice } = require('./hue');

const catchError = ({ message }) => {
  console.log('[ERROR]', message);

  if (message.includes('link button not pressed')) {
    console.log('\nPress the link button on your bridge and try again.');
  }
};

const addUsernameToEnv = (username) => {
  const envPath = `${__dirname}/.env`;
  const usernameLine = `USERNAME=${username}`;
  let updatedEnv = `${usernameLine}`;
  let noUsername = true;

  try {
    const envBuffer = fs.readFileSync(envPath);
    const lines = envBuffer.toString().split('\n');
    let newLines = lines.map(line => {
      if (line.slice(0, 9) === 'USERNAME=') {
        noUsername = false;

        return usernameLine;
      }
      return line;
    });

    if (noUsername) newLines = [updatedEnv, ...newLines];
    if (newLines.length === 1) newLines.push('');

    updatedEnv = newLines.join('\n');
    console.log('[INFO] Updating .env with new USERNAME.');
  } catch (e) {
    console.log('[INFO] No .env found. Adding USERNAME to new .env.');
    updatedEnv += '\n';
  }
  
  fs.writeFileSync(envPath, updatedEnv);
}

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
  const deviceName = (
    getDeviceName() || 
    `Phillips Hue node.js project ${String(Math.random()).slice(2, 5)}`
  );
  
  const username = await registerDevice(deviceName).catch(catchError);
  
  if (username) {
    console.log(`[INFO] Device Name: ${deviceName}`);
    addUsernameToEnv(username);
  }
};

main();
