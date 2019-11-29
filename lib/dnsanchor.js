async function readData(f) {
  const content = await f.readFile();
  return JSON.parse(content);
}


export async function run(cwd, { console }) {
  console.log('Hello, world!');
  const config = await readData(cwd.join('config.json'));
  console.log('API key length:', config.API_KEY.length);
}
