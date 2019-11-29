import NfsnClient from 'nfsn-client';
import { promises as fsp } from 'fs';

function asPromise(calling) {
  return new Promise((resolve, reject) => {
    function cb(err, result) {
      console.log('cb', calling);
      if (err) {
	reject(err);
      } else {
	resolve(result);
      }
    }
    console.log('calling', calling);
    calling(cb);
  });
}

async function main(process) {
  console.log('main');
  const configTxt = await fsp.readFile('config.json');
  console.log('readFile done');
  const apiKey = JSON.parse(configTxt).API_KEY;
  const login = process.env['LOGNAME'];

  const client = new NfsnClient({ login, apiKey });

  console.log('listRRs');
  const resp = await asPromise(cb => client.dns.listRRs('madmode.com', {type: 'MX'}, cb));
  console.log(JSON.stringify(resp, undefined, 2));
}

/* global process, require, module */
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  main(process)
    .then(_ => process.exit(0))
    .catch(oops => {
      console.log('ERROR!');
      console.error(oops);
      process.exit(1);
    });
}
