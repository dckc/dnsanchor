// @ts-check
import { makePath, httpsPath } from './pathlib';

export { makePath, httpsPath };

const { freeze } = Object;

/**
 * @template T
 * @param {Path} f
 * @param {T} _ex
 * WARNING: assumes input data has correct type
 * @returns { Promise<T> }
 */
export async function readData(f, _ex) {
  const content = await f.readFile();
  return JSON.parse(content);
}

export const ipAddressService = 'api.ipify.org';

/**
 * @param {string} requestURI
 * @param {string} body
 * @param {{ login: string, apiKey: string }} creds
 * @param {{ timestamp: number | string, salt: string }} param3
 * @param {(txt: string) => string} sha1hex
 * @returns { string }
 */
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

auth.test = function testAuth(sha1hex) {
  const example =
    'testuser;1012121212;dkwo28Sile4jdXkw;p3kxmRKf9dk3l6ls;/site/example/getInfo;da39a3ee5e6b4b0d3255bfef95601890afd80709';
  const expected =
    'testuser;1012121212;dkwo28Sile4jdXkw;0fa8932e122d56e2f6d1550f9aab39c4aef8bfc4';
  const [login, timestamp, salt, apiKey, url] = example.split(';');
  const actual = auth(url, '', { login, apiKey }, { timestamp, salt }, sha1hex);
  console.log({ actual, expected, OK: actual === expected });
};

/**
 * @param {{[p: string]: string | number | undefined }} params
 * @param {string=} path
 * @returns { string }
 */
function qs(params, path) {
  const pairs = Object.entries(params)
    .filter(([_n, v]) => typeof v !== 'undefined')
    .map(([n, v]) => `${n}=${encodeURIComponent(v)}`)
    .join('&');
  return path && pairs ? `${path}?${pairs}` : pairs;
}

/**
 * @param {string} login
 * @param {string} apiKey
 * @param {*} param2
 *
 * @typedef {{name: string, type: string, data: string}} RR
 * @typedef {{name: string, type: string, data: string, ttl?: number | string }} RRAdd
 * @typedef {{name?: string, type?: string, data?: string, ttl?: number|string}} RRPat
 * @typedef {{
 *   listRRs: (q: RRPat) => Promise<RR[]>,
 *   addRR: (rr: RRAdd) => Promise<null>,
 *   removeRR: (rr: RR) => Promise<null>,
 * }} Domain
 */
export function nfsnEndPoint(
  login,
  apiKey,
  { web, clock, randomBytesHex, sha1hex },
) {
  // ISSUE: sha1hex is actually powerless but it's not portable so we
  // can't fix its definition.

  /**
   * @template T
   * @param {string} path
   * @param {{[p: string]: string | number | undefined}} args
   * @param {T} _ex
   * @returns { Promise<T>}
   */
  async function apiCall(path, args, _ex) {
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

  const listEx = /** @type {RR} */ { name: 'n', type: 'A', data: '1.2.3.4' };

  return freeze({
    /**
     * @param {string} domain
     * @returns { Domain }
     */
    domain(domain) {
      return freeze({
        async listRRs({ name, type, data }) {
          return apiCall(`/dns/${domain}/listRRs`, { name, type, data }, [
            listEx,
          ]);
        },
        // ISSUE: separate read-only access?
        async addRR({ name, type, data, ttl }) {
          return apiCall(
            `/dns/${domain}/addRR`,
            { name, type, data, ttl },
            null,
          );
        },
        async removeRR({ name, type, data }) {
          return apiCall(`/dns/${domain}/removeRR`, { name, type, data }, null);
        },
      });
    },
  });
}

/**
 *
 * @param {string} ip
 * @param {Domain} domain
 * @param {*} name
 */
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

const configEx = {
  login: 'mememe',
  API_KEY: 'super-sekret',
  domain: 'my.nfsn.domain.example',
  host: 'dyndnshost1',
};

/**
 *
 * @param {Path} cwd
 * @param {{ https: (host: string, port: number) => Path & WebPath }} web
 * @param {{ clock: () => number, randomBytesHex: (qty: number) => string, sha1hex: (preimage: string) => string }} io
 *
 * @typedef { import('./pathlib').Path } Path
 * @typedef { import('./pathlib').WebPath } WebPath
 */
export async function run(cwd, web, { clock, randomBytesHex, sha1hex }) {
  console.log('Hello, world!');

  const config = await readData(cwd.join('config.json'), configEx);
  console.log('API key length:', config.API_KEY.length);

  const ip = await web.https(ipAddressService, 443).readFile();
  console.log('IP address:', ip); // origin

  const domain = nfsnEndPoint(config.login, config.API_KEY, {
    web,
    clock,
    randomBytesHex,
    sha1hex,
  }).domain(config.domain);

  await ensureCurrent(ip, domain, config.host);
}
