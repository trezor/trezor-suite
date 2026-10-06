const stringify = (arg: unknown) => {
    if (arg == null) return String(arg);
    if (arg instanceof Error) return arg.stack ?? String(arg);
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'bigint' || typeof arg === 'number') return arg.toString();
    if (Buffer.isBuffer(arg)) return arg.toString('hex');
    if (ArrayBuffer.isView(arg)) {
        return Buffer.from(arg.buffer, arg.byteOffset, arg.byteLength).toString('hex');
    }
    if (typeof arg === 'function') return String(arg);

    return undefined;
};

export const stringifyLogArgs = (args: unknown[]): string =>
    args
        .map(arg => {
            const str = stringify(arg);
            if (str !== undefined) return str;

            try {
                return (
                    JSON.stringify(arg, function (key, value) {
                        // `JSON.stringify` applies `toJSON` before the replacer, so `value` is
                        // already a plain object for types implementing it, such as `Buffer`.
                        // Reading the untouched value from the holder keeps binary data hex.
                        return stringify(this[key]) ?? value;
                    }) ?? String(arg)
                );
            } catch {
                // circular references
                return String(arg);
            }
        })
        .join(', ');
