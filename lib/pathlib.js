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

export function httpsPath(host, port, path, { makeRequest }) {
  const mk = there => httpsPath(host, port, there, { makeRequest });

  // https://github.com/Moddable-OpenSource/moddable/blob/public/documentation/network/network.md#http-request
  const MSG = {
    statusReceived: 1,
    responseComplete: 5,
  };
  const HTTP = {
    OK: 200,
  };

  async function readFile() {
    return new Promise((resolve, reject) => {
      try {
	const request = makeRequest({ host, port, path, response: String });
	request.callback = function(message, value, etc) {
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
