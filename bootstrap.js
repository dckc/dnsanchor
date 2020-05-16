/** main - platform access and startup

This main module runs in the "primal" realm/compartment with access to
platform ambient authority (e.g. trace) and sets up initial
connectivity connections.

*/
/* global trace, Compartment */

import { File, Iterator } from 'file'; // eslint-disable-line import/no-unresolved
// ISSUE: anything above kernel calls such as socket() should be in
// pure modules.
import { Request } from 'http';
import { Digest } from 'crypt';
import SecureSocket from 'securesocket'; // eslint-disable-line import/no-unresolved

import makeConsole from './lib/console';

const harden = x => Object.freeze(x, true);

const clock = harden(() => Date.now());

function randomBytesHex(qty) {
  if (qty !== 8) {
    throw new Error('not supported');
  }
  const abs = x => x < 0 ? -x : x;
  const hex = (x, w) => abs(x|0).toString(16).toLowerCase().padStart(w, '0');
  const a = hex(Math.random() * 4294967295, 8);
  const b = hex(Math.random() * 4294967295, 8);
  return a + b;
}

function sha1hex(txt) {
  let sha1 = new Digest("SHA1");
  sha1.write(txt);

  // https://stackoverflow.com/a/40031979/7963
  function buf2hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  }

  return buf2hex(sha1.close()).toLowerCase();
}

export default async function main() {
  const console = makeConsole(trace);

  async function go() {
    console.log('@@go...');

    const c1 = new Compartment({ console });
    console.log('@@got compartment...');
    const modNS = await c1.import('lib/dnsanchor');
    const { run, makePath, httpsPath, httpsConstruct, auth } = modNS;
    console.log('@@got exports...');

    const cwd = makePath('/home/connolly/projects/dnsanchor', { File, Iterator }); //@@
    const makeRequest = httpsConstruct({ Request, SecureSocket });
    const web = harden({
      https(host, port) {
        console.log('web.https:', host, port);
        return httpsPath(host, port, '/', { host }, { makeRequest });
      },
    });
    console.log('run()...');
    auth.test(sha1hex);

    await run(cwd, web, { clock, randomBytesHex, sha1hex });
  }

  console.log('bootstrap main()...');
  let result;
  try {
    result = go();
  } catch (err) {
    console.log(err);
    console.log(err.message);
  }
  console.log('@@ran');
  return result;
}
