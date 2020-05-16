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
  // return opts => new Request({ ...opts, port: 80 });
  return opts => new Request({ Socket: SecureSocket, ...opts });
}

const HTTP = {
  OK: 200,
};

export function httpsPath(host, port, path, headers, { makeRequest }) {
  const mk = there => httpsPath(host, port, there, headers, { makeRequest });
  const addr = `https://${host}:${port}${path}`;
  console.log('@@httpsPath', addr, headers);

  // https://github.com/Moddable-OpenSource/moddable/blob/public/documentation/network/network.md#http-request
  const MSG = {
    statusReceived: 1,
    responseComplete: 5,
  };

  function sendRequest(method, body = false) {
    // console.log('sendRequest', addr);
    return new Promise((resolve, reject) => {
      try {
	if (body) {
	  headers['content-length'] = body.length.toString();
	}
        console.log('@@readFile makeRequest', JSON.stringify({ host, port, method, path, headers, body }));
        const request = makeRequest({ host, port, method, path, headers, body, response: String });
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

  return harden({
    toString: () => addr,
    join: (...others) => mk([path, ...others].join('/').replace(/^\/+/, '/')),
    withHeaders: more =>
      httpsPath(host, port, path, { ...headers, ...more }, { makeRequest }),
    readFile: () => sendRequest('GET'),
    post: body => sendRequest('POST', body),
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
              new Error(JSON.stringify({ status: res.statusCode, body: output.join('') })),
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
