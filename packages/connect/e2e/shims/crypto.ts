import hash from 'create-hash';

export function getRandomValues(array: Uint8Array): Uint8Array {
    return crypto.getRandomValues(array);
}

export function randomBytes(size: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(size));
}

export function createHash(algorithm: hash.algorithm) {
    return hash(algorithm);
}
