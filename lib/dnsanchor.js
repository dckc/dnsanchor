import makeConsole from './console';
import { makePath, httpsPath, httpsConstruct } from './pathlib';

export { makeConsole };
export { makePath, httpsPath, httpsConstruct };

const harden = x => Object.freeze(x, true);


export async function readData(f) {
  const content = await f.readFile();
  return JSON.parse(content);
}

export async function currentIP(web) {
  const info = await readData(web.https('httpbin.org', 443).join('ip'));
  return info['origin'];
}

export function auth(requestURI, body, { login, apiKey }, { timestamp, salt }, sha1hex) {
  console.log('@@auth', { requestURI, body, login, apiKey, timestamp, salt });
  const bodyHash = sha1hex(body);
  const parts = [login, timestamp.toString(), salt, apiKey, requestURI, bodyHash];
  const hash = sha1hex(parts.join(';'));
  return [login, timestamp, salt, hash].join(';');
}


function qs(params) {
  const pairs = Object.entries(params)
	.filter(([n, v]) => typeof v !== 'undefined')
	.map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join(';');
  return pairs === '' ? '' : `?${pairs}`;
}


export function nfsnEndPoint(login, apiKey, { web, clock, randomBytesHex, sha1hex }) {
  // ISSUE: sha1hex is actually powerless but it's not portable so we
  // can't fix its definition.

  async function apiCall(path, method, args) {
    const timestamp = Math.floor(clock() / 1000);
    const salt = randomBytesHex(8);
    const [pathQ, body] = method === 'GET' ? [path + qs(args), ''] : [path, qs(args)];
    const cred = auth(pathQ, body, { login, apiKey }, { timestamp, salt }, sha1hex);
    const access = web.https('api.nearlyfreespeech.net', 443)
	  .join(pathQ)
	  .withHeaders({ 'X-NFSN-Authentication': cred });
    const content = await access.post(body);
    return JSON.parse(content);
  }

  return harden({
    async listRRs(domain, { name, type, data }) {
      return apiCall('/dns/' + domain + '/listRRs', 'POST', { name, type, data });
    },
  });
}

export async function run(cwd, web, { console }) {
  console.log('Hello, world!');
  const config = await readData(cwd.join('config.json'));
  console.log('API key length:', config.API_KEY.length);

  const ip = await readData(web.https('httpbin.org').join('ip'));
  console.log('IP address:', ip); // origin
}
