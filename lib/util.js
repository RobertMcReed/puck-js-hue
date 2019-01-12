const concat = (...args) => args.join('');

const info = (...args) => console.log('[INFO]', ...args);

const err = (...args) => console.error('[ERROR]', ...args);

const br = () => console.log();

module.exports = {
  concat,
  log: { info, err, br },
};
