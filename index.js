import url from 'url';

import { readData, currentIP, auth, nfsnEndPoint } from './lib/dnsanchor';
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

async function main({ fsp, path, NfsnClient, https, crypto, clock }) {
  const sha1hex = txt => crypto.createHash('sha1').update(txt).digest('hex');

  testAuth(crypto, sha1hex);

  const cwd = makeNodePath('.', { fsp, path });
  const web = harden({
    https: (host, port) => makeNodeHttpPath(`https://${host}:${port}/`, {},
					    { request: https.request, resolve: url.resolve }),
  });

  const ip = await currentIP(web);
  console.log('@@currentIP', { ip });

  const config = await readData(cwd.join('config.json'));

  const client = new NfsnClient({ login: config.login, apiKey: config.API_KEY });

  const resp = await asPromise(cb => client.dns.listRRs(config.domain, {type: 'A'}, cb));
  console.log('listRRs:', JSON.stringify(resp, undefined, 2));

  const randomBytesHex = qty => crypto.randomBytes(qty).toString('hex');
  const ep = nfsnEndPoint(config.login, config.API_KEY, { web, clock, randomBytesHex, sha1hex });
  const info = await ep.listRRs(config.domain, {}); // , { type: 'A' }
  console.log('@@listRRs', info);
}

/* global process, require, module */
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  main({
    fsp: require('fs').promises,
    path: require('path'),
    https: require('https'),
    crypto: require('crypto'),
    clock: () => Date.now(),
    NfsnClient: require('nfsn-client'),
  })
    .then(_ => process.exit(0))
    .catch(oops => {
      console.error(oops);
      process.exit(1);
    });
}
