const info = (...args) => console.log('[INFO]', ...args);

const err = (...args) => console.error('[ERROR]', ...args);

const br = () => console.log();

module.exports = { info, err, br };
