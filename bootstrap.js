/** main - platform access and startup

This main module runs in the "primal" realm/compartment with access to
platform ambient authority (e.g. trace) and sets up initial
connectivity connections.

*/
/* global trace, Compartment */

import { File, Iterator } from "file";

import makeConsole from './lib/console';
import { makePath } from './lib/pathlib';

export default async function main() {
  const console = makeConsole(trace);
  console.log('bootstrap main()...');

  /* From the module map of this primal compartment, extract the
     (pure) library modules for use in a confied compartment. */
  const libModMap = Object.fromEntries(Object.entries(Compartment.map).filter(
    ([specifier, _]) => specifier.startsWith('lib/')));

  const confined = new Compartment('lib/dnsanchor', {}, libModMap);
  const { run } = confined.export;

  const cwd = makePath('.', { File, Iterator });
  console.log('run()...');
  return run(cwd, { console });
}

