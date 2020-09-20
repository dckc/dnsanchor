// @ts-check

/**
 * @template T
 * @param {(cb: (err: any, result: T) => void) => void} calling
 * @returns { Promise<T> }
 */
export default function asPromise(calling) {
  return new Promise((resolve, reject) => {
    /** @type { (err: any, result: T) => void } */
    function cb(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    }
    calling(cb);
  });
}
