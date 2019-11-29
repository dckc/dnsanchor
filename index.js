import url from 'url';

import { readData, currentIP, auth } from './lib/dnsanchor';
import { makeNodePath, makeNodeHttpPath } from './lib/pathlib';

const harden = x => Object.freeze(x);


function asPromise(calling) {
  return new Promise((resolve, reject) => {
    function cb(err, result) {
      if (err) {
	reject(err);
      } else {
	resolve(result);
      }
    }
    calling(cb);
  });
}

function testAuth(crypto) {
  const example = 'testuser;1012121212;dkwo28Sile4jdXkw;p3kxmRKf9dk3l6ls;/site/example/getInfo;da39a3ee5e6b4b0d3255bfef95601890afd80709';
  const expected = 'testuser;1012121212;dkwo28Sile4jdXkw;0fa8932e122d56e2f6d1550f9aab39c4aef8bfc4';
  const [login, timestamp, salt, apiKey, url, bodyHash] = example.split(';');
  const sha1hex = txt => crypto.createHash('sha1').update(txt).digest('hex');
  const actual = auth(url, '', { login, apiKey }, { timestamp, salt }, sha1hex);
  console.log({actual, expected, OK: actual === expected});
}

async function main({ fsp, path, NfsnClient, https, crypto }) {
  console.log('main');
  const sha1hex = txt => crypto.createHash('sha1').update(txt).digest('hex');

  testAuth(crypto);

  const cwd = makeNodePath('.', { fsp, path });
  const web = harden({
    https: (host, port) => makeNodeHttpPath(`https://${host}:${port}/`,
					    { get: https.get, resolve: url.resolve }),
  });


  const ip = await currentIP(web);
  console.log({ ip });

  const config = await readData(cwd.join('config.json'));

  const client = new NfsnClient({ login: config.login, apiKey: config.API_KEY });

  console.log('listRRs');
  const resp = await asPromise(cb => client.dns.listRRs(config.domain, {type: 'A'}, cb));
  console.log(JSON.stringify(resp, undefined, 2));
}

/* global process, require, module */
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  main({
    fsp: require('fs').promises,
    path: require('path'),
    https: require('https'),
    crypto: require('crypto'),
    NfsnClient: require('nfsn-client'),
  })
    .then(_ => process.exit(0))
    .catch(oops => {
      console.log('ERROR!');
      console.error(oops);
      process.exit(1);
    });
}
