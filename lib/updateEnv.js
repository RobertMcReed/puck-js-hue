const fs = require('fs-extra');
const { log } = require('./util');

const updateEnv = async ({ key, value, overwrite }) => {
  const envPath = `${__dirname}/../.env`;
  const kvPair = `${key}=${value}`;
  let inserted = false;
  let updatedEnv = null;

  try {
    const file = await fs.readFile(envPath, 'utf-8');
    const lines = file.split('\n');
    const updatedLines = lines
      .filter(x => x)
      .map((line) => {
        // see if we have an un-commented line matching our key
        if (line.slice(0, key.length + 1) === `${key}=`) {
          if (overwrite) inserted = true;

          // overwrite or comment it out
          return overwrite ? kvPair : `# ${line}`;
        }

        return line;
      });

    if (!inserted) updatedLines.push(kvPair);
    updatedLines.push('');

    updatedEnv = updatedLines.join('\n');
    log.info(`Updating .env with ${kvPair}.`);
  } catch (e) {
    // env does not exist
    log.info(`No .env found. Adding ${kvPair} to new .env.`);
    updatedEnv = `${kvPair}\n`;
  }

  await fs.writeFile(envPath, updatedEnv);
};

module.exports = updateEnv;
