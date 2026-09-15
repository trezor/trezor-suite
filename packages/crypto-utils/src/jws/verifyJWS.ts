// A compact JWS is just three base64url segments, `<header>.<payload>.<signature>`, and the
// signature covers the ASCII bytes of `<header>.<payload>`. The `jws` package delegates the
// signature check to Node's `crypto`, which on React Native becomes crypto-browserify and takes
// over a second per verification. `jose` verifies through SubtleCrypto like we do here, but does
// not support React Native and is a large dependency for a single ES256 check. Splitting the
// segments and decoding a PEM key ourselves is a few lines, and lets the actual ECDSA math run in
// SubtleCrypto, which is native on every platform we ship to and brings excellent performance.

import { base64, base64urlnopad, hex, utf8 } from '@scure/base';

const P256_SPKI_PREFIX = '3059301306072a8648ce3d020106082a8648ce3d030107034200';

const ES256_SIGNATURE_LENGTH = 64;

// Tolerates missing PEM armor lines and any line-break style, including a literal '\n' in
// the key constant.
const decodePublicKeyPEM = (publicKeyPEM: string) =>
    base64.decode(publicKeyPEM.replace(/-----[A-Z ]+-----/g, '').replace(/\\n|\s/g, ''));

const decodeBase64Url = (value: string) => {
    try {
        return base64urlnopad.decode(value);
    } catch {
        return undefined;
    }
};

const decodeHeaderAlgorithm = (encodedHeader: string) => {
    const headerBytes = decodeBase64Url(encodedHeader);
    if (!headerBytes) return undefined;

    try {
        const header: unknown = JSON.parse(utf8.encode(headerBytes));

        return typeof header === 'object' && header !== null && 'alg' in header
            ? header.alg
            : undefined;
    } catch {
        return undefined;
    }
};

// SubtleCrypto requires ArrayBuffer-backed views, which the decoders do not guarantee by type.
const toBufferSource = (bytes: Uint8Array) => new Uint8Array(bytes);

const getSubtleCrypto = () => {
    const subtleCrypto = globalThis.crypto?.subtle;
    if (!subtleCrypto) {
        throw new Error('SubtleCrypto is not available.');
    }

    return subtleCrypto;
};

type VerifyJWSParams = {
    jws: string;
    publicKeyPEM: string;
};

/**
 * Verifies the signature of a compact-serialized JWS signed with ES256 over a P-256 key using
 * SubtleCrypto, which is native on web, Node and React Native (react-native-quick-crypto).
 */
export const verifyJWS = async ({ jws, publicKeyPEM }: VerifyJWSParams): Promise<boolean> => {
    const [encodedHeader, encodedPayload, encodedSignature, ...rest] = jws.split('.');

    if (
        encodedHeader === undefined ||
        encodedPayload === undefined ||
        encodedSignature === undefined ||
        rest.length > 0
    ) {
        return false;
    }

    if (decodeHeaderAlgorithm(encodedHeader) !== 'ES256') {
        return false;
    }

    const signature = decodeBase64Url(encodedSignature);
    if (signature?.length !== ES256_SIGNATURE_LENGTH) {
        return false;
    }

    const publicKeyDER = decodePublicKeyPEM(publicKeyPEM);
    if (!hex.encode(publicKeyDER).startsWith(P256_SPKI_PREFIX)) {
        throw new Error('Unsupported JWS public key, expected P-256 SPKI PEM.');
    }

    const subtleCrypto = getSubtleCrypto();
    const publicKey = await subtleCrypto.importKey(
        'spki',
        toBufferSource(publicKeyDER),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify'],
    );

    return subtleCrypto.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        toBufferSource(signature),
        toBufferSource(utf8.decode(`${encodedHeader}.${encodedPayload}`)),
    );
};
