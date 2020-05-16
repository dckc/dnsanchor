/** console logging */

const { freeze } = Object;

const text = it => (typeof it === 'object' ? JSON.stringify(it) : `${it}`);
const combine = (...things) => `${things.map(text).join(' ')}\n`;

export default function makeConsole(write_) {
  const write = write_ || trace; // note ocap exception for tracing / logging
  return freeze({
    log(...things) {
      write(combine(...things));
    },
    // node.js docs say this is just an alias for error
    warn(...things) {
      write(combine('WARNING: ', ...things));
    },
    // node docs say this goes to stderr
    error(...things) {
      write(combine('ERROR: ', ...things));
    },
  });
}
