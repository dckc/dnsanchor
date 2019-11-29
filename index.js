import url from 'url';

import { readData, currentIP } from './lib/dnsanchor';
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

async function main({ fsp, path, NfsnClient, https }) {
  console.log('main');

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
    NfsnClient: require('nfsn-client'),
  })
    .then(_ => process.exit(0))
    .catch(oops => {
      console.log('ERROR!');
      console.error(oops);
      process.exit(1);
    });
}
