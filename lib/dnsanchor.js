import makeConsole from './lib/console';
import { makePath, httpsPath, httpsConstruct } from './lib/pathlib';

export { makeConsole };
export { makePath, httpsPath, httpsConstruct };

async function readData(f) {
  const content = await f.readFile();
  return JSON.parse(content);
}

export async function run(cwd, web, { console }) {
  console.log('Hello, world!');
  const config = await readData(cwd.join('config.json'));
  console.log('API key length:', config.API_KEY.length);

  const ip = await readData(web.https('httpbin.org').join('ip'));
  console.log('IP address:', ip); // origin
}
