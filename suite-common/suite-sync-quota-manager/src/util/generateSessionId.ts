export const generateSessionId = (): string =>
    crypto
        .getRandomValues(new Uint8Array(16))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
