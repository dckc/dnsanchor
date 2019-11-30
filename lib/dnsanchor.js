import makeConsole from './console';
import { makePath, httpsPath, httpsConstruct } from './pathlib';

export { makeConsole };
export { makePath, httpsPath, httpsConstruct };

const harden = x => Object.freeze(x, true);

export async function readData(f) {
  const content = await f.readFile();
  return JSON.parse(content);
}

export const ipAddressService = 'api.ipify.org';

export function auth(
  requestURI,
  body,
  { login, apiKey },
  { timestamp, salt },
  sha1hex,
) {
  const bodyHash = sha1hex(body);
  const parts = [
    login,
    timestamp.toString(),
    salt,
    apiKey,
    requestURI,
    bodyHash,
  ];
  const hash = sha1hex(parts.join(';'));
  return [login, timestamp, salt, hash].join(';');
}

auth.test = function testAuth(crypto, sha1hex) {
  const example =
    'testuser;1012121212;dkwo28Sile4jdXkw;p3kxmRKf9dk3l6ls;/site/example/getInfo;da39a3ee5e6b4b0d3255bfef95601890afd80709';
  const expected =
    'testuser;1012121212;dkwo28Sile4jdXkw;0fa8932e122d56e2f6d1550f9aab39c4aef8bfc4';
  const [login, timestamp, salt, apiKey, url] = example.split(';');
  const actual = auth(url, '', { login, apiKey }, { timestamp, salt }, sha1hex);
  console.log({ actual, expected, OK: actual === expected });
};

function qs(params, path) {
  const pairs = Object.entries(params)
    .filter(([_n, v]) => typeof v !== 'undefined')
    .map(([n, v]) => `${n}=${encodeURIComponent(v)}`)
    .join('&');
  return path && pairs ? `${path}?${pairs}` : pairs;
}

export function nfsnEndPoint(
  login,
  apiKey,
  { web, clock, randomBytesHex, sha1hex },
) {
  // ISSUE: sha1hex is actually powerless but it's not portable so we
  // can't fix its definition.

  async function apiCall(path, args) {
    const timestamp = Math.floor(clock() / 1000);
    const salt = randomBytesHex(8);
    const body = qs(args);
    const cred = auth(
      path,
      body,
      { login, apiKey },
      { timestamp, salt },
      sha1hex,
    );
    const access = web
      .https('api.nearlyfreespeech.net', 443)
      .join(path)
      .withHeaders({
        'X-NFSN-Authentication': cred,
        'Content-Type': 'application/x-www-form-urlencoded',
      });
    const content = await access.post(body);
    // console.log('apiCall:', { access: access.toString(), path, method: 'POST', body });
    return content ? JSON.parse(content) : null;
  }

  return harden({
    domain(domain) {
      return harden({
        async listRRs({ name, type, data }) {
          return apiCall(`/dns/${domain}/listRRs`, { name, type, data });
        },
        // ISSUE: separate read-only access?
        async addRR({ name, type, data, ttl }) {
          return apiCall(`/dns/${domain}/addRR`, { name, type, data, ttl });
        },
        async removeRR({ name, type, data }) {
          return apiCall(`/dns/${domain}/removeRR`, { name, type, data });
        },
      });
    },
  });
}

export async function ensureCurrent(ip, domain, name) {
  const addrs = await domain.listRRs({ name, type: 'A' });
  const target = addrs.filter(rr => rr.data === ip);
  if (target.length > 0) {
    console.log({ action: 'noop', name, ip, target });
    return [];
  }
  console.log({ action: 'add', name, type: 'A', data: ip });
  console.log({ action: 'remove', addrs });
  return Promise.all([
    domain.addRR({ name, type: 'A', data: ip }),
    ...addrs.map(extra => domain.removeRR(extra)),
  ]);
}

export async function run(cwd, web, { console }) {
  console.log('Hello, world!');
  const config = await readData(cwd.join('config.json'));
  console.log('API key length:', config.API_KEY.length);

  const ip = await readData(web.https('httpbin.org').join('ip'));
  console.log('IP address:', ip); // origin
}
