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
import SecureSocket from 'securesocket'; // eslint-disable-line import/no-unresolved

import makeConsole from './lib/console';

const harden = x => Object.freeze(x, true);

export default async function main() {
  const console = makeConsole(trace);
  console.log('bootstrap main()...');

  /* From the module map of this primal compartment, extract the
     (pure) library modules for use in a confied compartment. */
  const libModMap = Object.fromEntries(
    Object.entries(Compartment.map).filter(([specifier, _]) =>
      specifier.startsWith('lib/'),
    ),
  );

  const confined = new Compartment('lib/dnsanchor', {}, libModMap);
  const { run, makePath, httpsPath, httpsConstruct } = confined.export;

  const cwd = makePath('.', { File, Iterator });
  const makeRequest = httpsConstruct({ Request, SecureSocket });
  const web = harden({
    https(host, port) {
      console.log('web.https:', host, port);
      return httpsPath(host, port, { makeRequest });
    },
  });
  console.log('run()...');
  return run(cwd, web, { console });
}
