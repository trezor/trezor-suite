// Axios v1.14.0 fetch adapter probes ReadableStream support at module load time by passing a
// stream to a Request constructor, which locks the stream. It then calls .cancel() on the
// original (now locked) reference. Expo's web-streams-polyfill correctly throws on this per
// the WHATWG spec, crashing the Jest worker and leaving simulator processes running.
// Suppress the error until axios ships a fix (axios/axios#10585).
if (typeof ReadableStream !== 'undefined') {
    const originalCancel = ReadableStream.prototype.cancel;
    ReadableStream.prototype.cancel = function (...args) {
        try {
            const result = originalCancel.apply(this, args);
            if (result && typeof result.then === 'function') {
                return result.catch(() => {});
            }

            return result;
        } catch {
            return Promise.resolve();
        }
    };
}
