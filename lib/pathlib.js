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
