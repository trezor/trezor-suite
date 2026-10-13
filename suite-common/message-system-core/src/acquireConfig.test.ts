import { compareConfigSequence, getRemoteConfigUrl, verifyConfigJws } from './acquireConfig';
import { CONFIG_URL_REMOTE } from './constants';

describe('getRemoteConfigUrl', () => {
    it('serves the stable config to codesigned builds and the develop one to the rest', () => {
        expect(getRemoteConfigUrl(true)).toBe(CONFIG_URL_REMOTE.stable);
        expect(getRemoteConfigUrl(false)).toBe(CONFIG_URL_REMOTE.develop);
    });
});

// A 64 byte ES256 signature of zeroes: long enough for the verifier to accept the shape and then
// reject the authenticity.
const ZEROED_SIGNATURE = 'A'.repeat(86);

describe('verifyConfigJws', () => {
    it('rejects a config that is not a JWS at all', () => {
        expect(() => verifyConfigJws('not-a-jws')).toThrow('Decoding of config failed');
    });

    it('rejects a config signed with an unexpected algorithm', () => {
        // A `{ "alg": "HS256" }` header over a `{ "version": 1 }` payload and a zeroed signature.
        const jwsWithWrongAlgorithm = `eyJhbGciOiAiSFMyNTYifQ.eyJ2ZXJzaW9uIjogMX0.${ZEROED_SIGNATURE}`;

        expect(() => verifyConfigJws(jwsWithWrongAlgorithm)).toThrow(
            'Wrong algorithm in JWS config header: HS256',
        );
    });

    it('rejects a config whose signature does not verify', () => {
        // A `{ "alg": "ES256" }` header over a `{ "version": 1 }` payload and a zeroed signature.
        const jwsWithInvalidSignature = `eyJhbGciOiAiRVMyNTYifQ.eyJ2ZXJzaW9uIjogMX0.${ZEROED_SIGNATURE}`;

        expect(() => verifyConfigJws(jwsWithInvalidSignature)).toThrow(
            'Config authenticity is invalid',
        );
    });
});

describe('compareConfigSequence', () => {
    it('accepts a higher sequence, tolerates the same one and refuses a rollback', () => {
        expect(compareConfigSequence(10, 11)).toBe('newer');
        expect(compareConfigSequence(10, 10)).toBe('same');
        expect(compareConfigSequence(10, 9)).toBe('older');
    });
});
