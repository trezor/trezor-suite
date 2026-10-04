// Build-time replacement for Node's `crypto` module (see vite.config.ts). @trezor/protocol
// re-exports the THP protocol, whose pairing code imports these functions. An old Trezor One
// speaks protocol v1 only, so nothing here is ever supposed to run. Every export throws so
// that an unexpected call fails loudly instead of silently producing weak cryptography.

const failUnsupported = (name: string): never => {
    throw new Error(`Node crypto.${name} is not available in the Trezor One migration app.`);
};

export const createHash = () => failUnsupported('createHash');
export const createHmac = () => failUnsupported('createHmac');
export const createCipheriv = () => failUnsupported('createCipheriv');
export const createDecipheriv = () => failUnsupported('createDecipheriv');
export const randomBytes = () => failUnsupported('randomBytes');
