const fs = require('fs');

const updateEnv = ({ key, value, overwrite = true }) => {
  const envPath = `${__dirname}/.env`;
  const newLine = `${key}=${value}`;
  let updatedEnv = `${newLine}`;
  let unique = true;

  try {
    const envBuffer = fs.readFileSync(envPath);
    const lines = envBuffer.toString().split('\n');
    let newLines = lines.map(line => {
      if (line.slice(0, 9) === `${key}=`) {
        if (overwrite) {
          unique = false;
  
          return newLine;
        } else return `# ${line}`;
      }
      return line;
    });

    if (unique) newLines = [updatedEnv, ...newLines];
    if (newLines.length === 1) newLines.push('');

    updatedEnv = newLines.join('\n');
    console.log(`[INFO] Updating .env with ${key}.`);
  } catch (e) {
    console.log(`[INFO] No .env found. Adding ${key} to new .env.`);
    updatedEnv += '\n';
  }
  
  fs.writeFileSync(envPath, updatedEnv);
}

module.exports = updateEnv;
