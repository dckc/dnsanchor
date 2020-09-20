// @ts-check

const { freeze } = Object;

/**
 * @typedef {{
 *   toString: () => string,
 *   join: (...others: string[]) => Path,
 *   readFile: () => Promise<string>
 * }} Path
 */

/**
 * @typedef {{
 *   withHeaders: (more: Headers) => Path & WebPath
 *   post: (body: string) => Promise<unknown>
 * }} WebPath
 *
 * @typedef {{[name: string]: string}} Headers
 */

/**
 * @param {string} filename
 * @param {any} io
 * @returns { Path }
 */
export function makePath(filename, { File, Iterator }) {
  /** @type { (there: string) => Path } */
  const mk = there => makePath(there, { File, Iterator });

  return freeze({
    toString() {
      return filename;
    },
    join(...others) {
      // ISSUE: support ../?
      return mk([filename, ...others].join('/'));
    },
    readFile() {
      return new Promise((resolve, reject) => {
        try {
          const file = new File(filename);
          resolve(file.read(String));
        } catch (err) {
          reject(err);
        }
      });
    },
  });
}

export function httpsConstruct({ Request, SecureSocket }) {
  // return opts => new Request({ ...opts, port: 80 });
  return opts => new Request({ Socket: SecureSocket, ...opts });
}

const HTTP = {
  OK: 200,
};

/**
 * @param {string} host
 * @param {number} port
 * @param {string} path
 * @param {Headers} headers
 * @param {{ makeRequest: any }} io
 * @returns { Path & WebPath }
 */
export function httpsPath(host, port, path, headers, { makeRequest }) {
  /** @type { (there: string) => Path } */
  const mk = there => httpsPath(host, port, there, headers, { makeRequest });
  const addr = `https://${host}:${port}${path}`;
  console.log('@@httpsPath', addr, headers);

  // https://github.com/Moddable-OpenSource/moddable/blob/public/documentation/network/network.md#http-request
  const MSG = {
    statusReceived: 1,
    responseComplete: 5,
  };

  /**
   * @param {'GET' | 'POST'} method
   * @param {false | string } body
   */
  function sendRequest(method, body = false) {
    // console.log('sendRequest', addr);
    return new Promise((resolve, reject) => {
      try {
        if (body) {
          headers['content-length'] = body.length.toString();
        }
        console.log(
          '@@readFile makeRequest',
          JSON.stringify({ host, port, method, path, headers, body }),
        );
        const request = makeRequest({
          host,
          port,
          method,
          path,
          headers,
          body,
          response: String,
        });
        request.callback = function sendRequestCallback(message, value, _etc) {
          console.log('@@sendRequest cb', message, value, _etc);
          if (message < 0) {
            reject(message);
          } else if (MSG.statusReceived === message) {
            if (value !== HTTP.OK) {
              console.log('HTTP response code??', value);
              reject(value);
            }
          } else if (message === MSG.responseComplete) {
            resolve(value);
          }
        };
      } catch (err) {
        console.log('@@readFile err', err);
        reject(err);
      }
    });
  }

  return freeze({
    toString: () => addr,
    join: (...others) => mk([path, ...others].join('/').replace(/^\/+/, '/')),
    withHeaders: more =>
      httpsPath(host, port, path, { ...headers, ...more }, { makeRequest }),
    readFile: () => sendRequest('GET'),
    post: body => sendRequest('POST', body),
  });
}

/**
 *
 * @param {string} filename
 * @param {{ fsp: typeof import('fs').promises, path: typeof import('path') }} io
 * @returns { Path }
 */
export function makeNodePath(filename, { fsp, path }) {
  /** @type {(there: string) => Path } */
  const mk = there => makeNodePath(there, { fsp, path });

  return freeze({
    toString: () => filename,
    join: (...others) => mk(path.join(filename, ...others)),
    readFile: () => fsp.readFile(filename, 'utf-8'),
  });
}

/**
 * @param {string} addr
 * @param {Headers} headers
 * @param {{ request: typeof import('http').request, resolve: typeof import('url').resolve }} io
 * @returns { Path & WebPath }
 */
export function makeNodeHttpPath(addr, headers, { request, resolve }) {
  const mk = there => makeNodeHttpPath(there, headers, { request, resolve });
  console.log('@@nodehttpsPath', addr, headers);

  function sendRequest(method, body) {
    return new Promise((done, reject) => {
      const output = [];
      const opts = { headers, method };
      const req = request(addr, opts, res => {
        // console.log(`${addr} / ${JSON.stringify(headers)} : ${res.statusCode}`);
        res.setEncoding('utf8');

        res.on('data', chunk => {
          output.push(chunk);
        });

        res.on('end', () => {
          if (res.statusCode === HTTP.OK) {
            done(output.join(''));
          } else {
            reject(
              new Error(
                JSON.stringify({
                  status: res.statusCode,
                  body: output.join(''),
                }),
              ),
            );
          }
        });
      });

      req.on('error', err => {
        reject(err);
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  return freeze({
    toString: () => addr,
    join: other => mk(resolve(addr, other)),
    withHeaders: more =>
      makeNodeHttpPath(addr, { ...headers, ...more }, { request, resolve }),
    readFile: () => sendRequest('GET'),
    writeFile: body => sendRequest('PUT', body),
    post: body => sendRequest('POST', body),
  });
}
