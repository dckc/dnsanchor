export default function asPromise(calling) {
  return new Promise((resolve, reject) => {
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
