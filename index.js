import url from 'url';

import {
  readData,
  ipAddressService,
  nfsnEndPoint,
  ensureCurrent,
  auth,
} from './lib/dnsanchor';
import { makeNodePath, makeNodeHttpPath } from './lib/pathlib';

const harden = x => Object.freeze(x);

async function main({ fsp, path, https, crypto, clock }) {
  const sha1hex = txt =>
    crypto
      .createHash('sha1')
      .update(txt)
      .digest('hex');
  const randomBytesHex = qty => crypto.randomBytes(qty).toString('hex');

  auth.test(sha1hex);

  const web = harden({
    https: (host, port) =>
      makeNodeHttpPath(
        `https://${host}:${port}/`,
        {},
        { request: https.request, resolve: url.resolve },
      ),
  });
  const ip = await web.https(ipAddressService, 443).readFile();

  const cwd = makeNodePath('.', { fsp, path });
  const config = await readData(cwd.join('config.json'));
  const domain = nfsnEndPoint(config.login, config.API_KEY, {
    web,
    clock,
    randomBytesHex,
    sha1hex,
  }).domain(config.domain);

  await ensureCurrent(ip, domain, config.host);
}

// eslint-disable-next-line no-redeclare
/* global process, require, module */
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  main({
    // eslint-disable-next-line global-require
    fsp: require('fs').promises,
    // eslint-disable-next-line global-require
    path: require('path'),
    // eslint-disable-next-line global-require
    https: require('https'),
    // eslint-disable-next-line global-require
    crypto: require('crypto'),
    clock: () => Date.now(),
  })
    .then(_ => process.exit(0))
    .catch(oops => {
      console.error(oops);
      process.exit(1);
    });
}
