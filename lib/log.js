const info = (...args) => console.log('[INFO]', ...args);

const err = (...args) => console.error('[ERROR]', ...args);

module.exports = { info, err };
