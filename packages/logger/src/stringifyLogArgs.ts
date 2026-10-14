const stringifyArg = (arg: unknown) => {
    if (arg == null) return String(arg);
    if (arg instanceof Error) return arg.stack ?? String(arg);
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'bigint') return arg.toString();
    if (typeof arg === 'number' && !Number.isFinite(arg)) return arg.toString();
    if (Buffer.isBuffer(arg)) return arg.toString('hex');
    if (ArrayBuffer.isView(arg)) {
        return Buffer.from(arg.buffer, arg.byteOffset, arg.byteLength).toString('hex');
    }
    if (typeof arg === 'function') return String(arg);

    return undefined;
};

const safeString = (arg: unknown) => {
    try {
        return String(arg);
    } catch {
        try {
            return Object.prototype.toString.call(arg);
        } catch {
            return '[unstringifiable]';
        }
    }
};

export const stringifyLogArgs = (args: unknown[]): string =>
    args
        .map(arg => {
            try {
                const str = stringifyArg(arg);
                if (str !== undefined) return str;

                return (
                    JSON.stringify(arg, function (key, value) {
                        // `this[key]` is the raw value before `toJSON` is applied.
                        return stringifyArg(this[key]) ?? value;
                    }) ?? String(arg)
                );
            } catch {
                // circular references
                return safeString(arg);
            }
        })
        .join(', ');
