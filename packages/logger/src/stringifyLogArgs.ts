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
                return JSON.stringify(arg, (_k, v) => stringify(v) || v) ?? String(arg);
            } catch {
                // circular references
                return String(arg);
            }
        })
        .join(', ');
