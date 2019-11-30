import url from 'url';

import { readData, ipAddressService, auth,
	 nfsnEndPoint, ensureCurrent } from './lib/dnsanchor';
import { makeNodePath, makeNodeHttpPath } from './lib/pathlib';
import asPromise from './lib/aspromise';

const harden = x => Object.freeze(x);


function testAuth(crypto, sha1hex) {
  const example = 'testuser;1012121212;dkwo28Sile4jdXkw;p3kxmRKf9dk3l6ls;/site/example/getInfo;da39a3ee5e6b4b0d3255bfef95601890afd80709';
  const expected = 'testuser;1012121212;dkwo28Sile4jdXkw;0fa8932e122d56e2f6d1550f9aab39c4aef8bfc4';
  const [login, timestamp, salt, apiKey, url, bodyHash] = example.split(';');
  const actual = auth(url, '', { login, apiKey }, { timestamp, salt }, sha1hex);
  console.log({actual, expected, OK: actual === expected});
}

async function main({ fsp, path, https, crypto, clock }) {
  const sha1hex = txt => crypto.createHash('sha1').update(txt).digest('hex');
  const randomBytesHex = qty => crypto.randomBytes(qty).toString('hex');

  // testAuth(crypto, sha1hex);

  const cwd = makeNodePath('.', { fsp, path });
  const web = harden({
    https: (host, port) => makeNodeHttpPath(`https://${host}:${port}/`, {},
					    { request: https.request, resolve: url.resolve }),
  });
  const config = await readData(cwd.join('config.json'));

  const ip = await web.https(ipAddressService, 443).readFile();

  const domain = nfsnEndPoint(config.login, config.API_KEY,
			      { web, clock, randomBytesHex, sha1hex })
	.domain(config.domain);
  await ensureCurrent(ip, domain, config.host);
}

/* global process, require, module */
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  main({
    fsp: require('fs').promises,
    path: require('path'),
    https: require('https'),
    crypto: require('crypto'),
    clock: () => Date.now(),
  })
    .then(_ => process.exit(0))
    .catch(oops => {
      console.error(oops);
      process.exit(1);
    });
}
