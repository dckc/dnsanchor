/** console logging */

const { freeze } = Object;

export default function makeConsole(trace) {
  const console = freeze({
    log(...things) {
      const txt = things.map(it => String(it)).join(' ') + '\n';
      trace(txt);
    },
  });
  return console;
}

