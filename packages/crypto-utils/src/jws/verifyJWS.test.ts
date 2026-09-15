import { verifyJWS } from './verifyJWS';

// Signed with a throwaway P-256 key using the `jws` package, payload:
// {"version":1,"sequence":1,"releases":[]}
const p256Jws =
    'eyJhbGciOiJFUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJzZXF1ZW5jZSI6MSwicmVsZWFzZXMiOltdfQ.HVjnHmy9Xa6CYBnMv3IxX0UiyyoHvaFnxJ6hyso0vHQ87XoLUl5PECvKIadBMydi0en_l_FyoY3PNokMAhFrDg';
const p256PublicKey = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAExfr8LVyO63Ra+dF5VXIAwXuoiYDG
3HYBQuZ2RmzIvd3uUGgzw1vgR3iPXs0C7fffCgOiGLsLFAL8nkQMOHeCZw==
-----END PUBLIC KEY-----`;
const otherP256PublicKey = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1mvvP92BUF0aWWRDDo+n3ii8dn/U
ubrU2PKQV5E34cZFk0YqBLJcUYSImJ2qpOB8y6+R6KGyZz9zZsDzDZXy2Q==
-----END PUBLIC KEY-----`;
// Firmware release config keys from @trezor/connect-data, to prove real keys pass the curve check.
const firmwareDevPublicKey = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEKjWdvv8SJm/UN2lXoEXl3ID35b/
hsz3etxANvUgLQ4r0eEhqVUEL5l+dRMgEv4Ycvr3UEcMkSFRPoA8ktxX1A==
-----END PUBLIC KEY-----
`;
const firmwareCodesignPublicKey = `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfEsFXNi5sdMxwiOYh4oRGorCM2RO
IEsfw3m+vWBrLb/r/GYWUVkVXWsZukLwPRZ8asP+7Ifd2ap7GZ2iQzWKCA==
-----END PUBLIC KEY-----
`;
const secp256k1PublicKey = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END PUBLIC KEY-----`;

const replaceHeader = (jws: string, header: object) => {
    const [, payload, signature] = jws.split('.');

    return `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${payload}.${signature}`;
};

const replacePayload = (jws: string, payload: object) => {
    const [header, , signature] = jws.split('.');

    return `${header}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`;
};

describe(verifyJWS.name, () => {
    it('verifies a JWS signed with a P-256 key', async () => {
        await expect(verifyJWS({ jws: p256Jws, publicKeyPEM: p256PublicKey })).resolves.toBe(true);
    });

    it.each([
        ['without PEM armor', p256PublicKey.replace(/-----[A-Z ]+-----/g, '')],
        ['on a single line', p256PublicKey.replace(/\n/g, '')],
        ['with CRLF line breaks', p256PublicKey.replace(/\n/g, '\r\n')],
        ['with literal \\n sequences', p256PublicKey.replace(/\n/g, '\\n')],
    ])('accepts the key %s', async (_, publicKeyPEM) => {
        await expect(verifyJWS({ jws: p256Jws, publicKeyPEM })).resolves.toBe(true);
    });

    it.each([
        ['dev', firmwareDevPublicKey],
        ['codesign', firmwareCodesignPublicKey],
    ])('accepts the %s firmware release config key as P-256', async (_, publicKeyPEM) => {
        await expect(verifyJWS({ jws: p256Jws, publicKeyPEM })).resolves.toBe(false);
    });

    it('rejects a tampered payload', async () => {
        const tamperedJws = replacePayload(p256Jws, { version: 1, sequence: 2, releases: [] });

        await expect(verifyJWS({ jws: tamperedJws, publicKeyPEM: p256PublicKey })).resolves.toBe(
            false,
        );
    });

    it('rejects a JWS verified with a different key', async () => {
        await expect(verifyJWS({ jws: p256Jws, publicKeyPEM: otherP256PublicKey })).resolves.toBe(
            false,
        );
    });

    it.each([{ alg: 'ES384' }, { alg: 'HS256' }, { alg: 'none' }, {}])(
        'rejects a JWS with header %j',
        async header => {
            const wrongAlgorithmJws = replaceHeader(p256Jws, header);

            await expect(
                verifyJWS({ jws: wrongAlgorithmJws, publicKeyPEM: p256PublicKey }),
            ).resolves.toBe(false);
        },
    );

    it.each([
        '',
        'not-a-jws',
        p256Jws.slice(0, -10),
        `${p256Jws}.extra`,
        p256Jws.replace(/\.[^.]+$/, '.!!!'),
    ])('rejects malformed input %s', async jws => {
        await expect(verifyJWS({ jws, publicKeyPEM: p256PublicKey })).resolves.toBe(false);
    });

    it('throws on a public key that is not P-256', async () => {
        await expect(verifyJWS({ jws: p256Jws, publicKeyPEM: secp256k1PublicKey })).rejects.toThrow(
            'Unsupported JWS public key',
        );
    });
});
