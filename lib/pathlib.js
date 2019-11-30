const harden = x => Object.freeze(x, true);

export function makePath(filename, { File, Iterator }) {
  const mk = there => makePath(there, { File, Iterator });

  return harden({
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
  return opts => Request({ Socket: SecureSocket, ...opts });
}

const HTTP = {
  OK: 200,
};

export function httpsPath(host, port, path, { makeRequest }) {
  const mk = there => httpsPath(host, port, there, { makeRequest });

  // https://github.com/Moddable-OpenSource/moddable/blob/public/documentation/network/network.md#http-request
  const MSG = {
    statusReceived: 1,
    responseComplete: 5,
  };

  async function readFile() {
    return new Promise((resolve, reject) => {
      try {
        const request = makeRequest({ host, port, path, response: String });
        request.callback = function readcb(message, value, _etc) {
          if (message < 0) {
            reject(message);
          } else if (MSG.statusReceived === message) {
            if (value !== HTTP.OK) {
              reject(value);
            }
          } else if (message === MSG.responseComplete) {
            resolve(value);
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  return harden({
    toString: () => `https://${host}:${port}/${path}`,
    join: (...others) => mk([path, ...others].join('/')),
    readFile,
  });
}

export function makeNodePath(filename, { fsp, path }) {
  const mk = there => makeNodePath(there, { fsp, path });

  return harden({
    toString: () => filename,
    join: (...others) => mk(path.join(filename, ...others)),
    readFile: () => fsp.readFile(filename),
  });
}

export function makeNodeHttpPath(addr, headers, { request, resolve }) {
  const mk = there => makeNodeHttpPath(there, headers, { request });

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
              new Error({ status: res.statusCode, body: output.join('') }),
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

  return harden({
    toString: () => addr,
    join: other => mk(resolve(addr, other)),
    withHeaders: more =>
      makeNodeHttpPath(addr, { ...headers, ...more }, { request }),
    readFile: () => sendRequest('GET'),
    writeFile: body => sendRequest('PUT', body),
    post: body => sendRequest('POST', body),
  });
}
