// Detects whether an error indicates a misbehaving Tor circuit that should be rotated.
// Covers errors from:
// - Node.js http module: ECONNRESET, ETIMEDOUT
//    see ./node_modules/@types/node/*/http.d.ts
// - undici (native fetch): UND_ERR_SOCKET ("other side closed")
// - socks package (SocksClientError): carries an `options` field
//    see https://github.com/JoshGlazebrook/socks/blob/76d013e4c9a2d956f07868477d8f12ec0b96edfc/src/common/util.ts
//    see https://github.com/JoshGlazebrook/socks/blob/76d013e4c9a2d956f07868477d8f12ec0b96edfc/src/common/constants.ts
// - socks system errors: type === 'system' with messages containing "socks" or "proxy" (case-insensitive)
export const isCircuitMisbehaving = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    if (
        'code' in error &&
        typeof error.code === 'string' &&
        ['ECONNRESET', 'UND_ERR_SOCKET', 'ETIMEDOUT'].includes(error.code)
    ) {
        return true;
    }

    if ('options' in error) {
        return true;
    }

    const socksErrors = /socks|proxy/i;
    if (
        'type' in error &&
        error.type === 'system' &&
        'message' in error &&
        typeof error.message === 'string' &&
        socksErrors.test(error.message)
    ) {
        return true;
    }

    // undici/native fetch wraps the underlying error in `cause`
    if ('cause' in error) {
        return isCircuitMisbehaving(error.cause);
    }

    return false;
};
