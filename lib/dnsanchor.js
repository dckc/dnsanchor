import makeConsole from './console';
import { makePath, httpsPath, httpsConstruct } from './pathlib';

export { makeConsole };
export { makePath, httpsPath, httpsConstruct };

export async function readData(f) {
  const content = await f.readFile();
  return JSON.parse(content);
}

export async function currentIP(web) {
  const info = await readData(web.https('httpbin.org', 443).join('ip'));
  return info['origin'];
}

export function auth(url, body, { login, apiKey }, { timestamp, salt}, sha1hex) {
  const bodyHash = sha1hex(body || '');
  const parts = [login, timestamp.toString(), salt, apiKey, url, bodyHash];
  const h = sha1hex(parts.join(';'));
  return [login, timestamp, salt, h].join(';');
}


export async function run(cwd, web, { console }) {
  console.log('Hello, world!');
  const config = await readData(cwd.join('config.json'));
  console.log('API key length:', config.API_KEY.length);

  const ip = await readData(web.https('httpbin.org').join('ip'));
  console.log('IP address:', ip); // origin
}
