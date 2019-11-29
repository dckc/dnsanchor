/** main - platform access and startup

This main module runs in the "primal" realm/compartment with access to
platform ambient authority (e.g. trace) and sets up initial
connectivity connections.

*/
/* global trace, Compartment */

import makeConsole from './console';

export default function main() {
  const console = makeConsole(trace);

  /* From the module map of this primal compartment, extract the
     (pure) library modules for use in a confied compartment. */
  const { dnsanchor } = Compartment.map;
  const pureModuleMap = { dnsanchor };

  const confined = new Compartment('dnsanchor', {}, pureModuleMap);
  const { run } = confined.export;
  
  run({ console });
}

