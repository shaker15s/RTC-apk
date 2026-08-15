/**
 * Request Timeout Helper (fixes A-7)
 * Wraps any promise with a hard timeout so users are never stuck on
 * an infinite spinner when the network hangs (no AbortController
 * support is needed on the caller side).
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms = 15000,
  timeoutMessage = 'انتهت مهلة الاتصال — تحقق من الشبكة وحاول مرة أخرى'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
