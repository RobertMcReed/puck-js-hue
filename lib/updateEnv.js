const fs = require('fs');
const log = require('./log');

const updateEnv = ({ key, value, overwrite }) => {
  const envPath = `${__dirname}/../.env`;
  const newLine = `${key}=${value}`;
  let updatedEnv = `${newLine}`;
  let addedKey = false;

  try {
    const envBuffer = fs.readFileSync(envPath);
    const lines = envBuffer.toString().split('\n');
    let newLines = lines.map(line => {
      if (line.slice(0, key.length + 1) === `${key}=`) {
        addedKey = true;

        return overwrite ? newLine : `# ${line}\n${newLine}`;
      }
      return line;
    });

    if (!addedKey) newLines = [newLine, ...newLines];
    if (newLines.length === 1) newLines.push('');

    updatedEnv = newLines.join('\n');
    log.info(`Updating .env with ${key}.`);
  } catch (e) {
    log.info(`No .env found. Adding ${key} to new .env.`);
    updatedEnv += '\n';
  }
  
  fs.writeFileSync(envPath, updatedEnv);
}

module.exports = updateEnv;
