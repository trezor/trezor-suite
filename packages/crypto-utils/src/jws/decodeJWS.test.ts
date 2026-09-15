import { decodeJWS } from './decodeJWS';

// Same fixture as verifyJWS.test.ts, payload: {"version":1,"sequence":1,"releases":[]}
const jws =
    'eyJhbGciOiJFUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJzZXF1ZW5jZSI6MSwicmVsZWFzZXMiOltdfQ.HVjnHmy9Xa6CYBnMv3IxX0UiyyoHvaFnxJ6hyso0vHQ87XoLUl5PECvKIadBMydi0en_l_FyoY3PNokMAhFrDg';
const [header, payload, signature] = jws.split('.');

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

describe('decodeJWS', () => {
    it('decodes header and payload without touching the signature', () => {
        expect(decodeJWS(jws)).toEqual({
            header: { alg: 'ES256' },
            payload: { version: 1, sequence: 1, releases: [] },
        });
        expect(decodeJWS(`${header}.${payload}.tampered`)).toEqual(decodeJWS(jws));
    });

    it.each([
        ['empty string', ''],
        ['two segments', `${header}.${payload}`],
        ['four segments', `${jws}.extra`],
        ['header not base64url', `!!!.${payload}.${signature}`],
        ['header not JSON', `${Buffer.from('nope').toString('base64url')}.${payload}.${signature}`],
        ['header not an object', `${encode('ES256')}.${payload}.${signature}`],
        ['payload not JSON', `${header}.${Buffer.from('{').toString('base64url')}.${signature}`],
    ])('returns undefined for %s', (_, malformedJws) => {
        expect(decodeJWS(malformedJws)).toBeUndefined();
    });
});
