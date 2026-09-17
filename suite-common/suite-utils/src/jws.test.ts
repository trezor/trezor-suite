import type * as JwsModule from './jws';
import { verifyJws } from './jws';

// Signed by the message-system dev private key, payload: {"version":1,"timestamp":"2021-03-03T03:48:16+00:00","sequence":1,"actions":[]}
const validJws =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEsCiAgICAiYWN0aW9ucyI6IFtdCn0K.Qtemcj062ih5j2F7SaMw1Sgms8jhuo-312f9_2unPzLWKrewQNwaHxyZsZCk3M_6r4CKRcHsSzRTYNOF8k2W9A';

const [header = '', payload = '', signature = ''] = validJws.split('.');

describe('verifyJws', () => {
    it('accepts a config signed by the dev key', () => {
        expect(verifyJws(validJws, 'ES256')).toBe(true);
    });

    it('rejects a tampered payload', () => {
        expect(verifyJws(`${header}.${payload}A.${signature}`, 'ES256')).toBe(false);
    });

    it('rejects a tampered signature', () => {
        expect(verifyJws(`${header}.${payload}.${signature.slice(0, -2)}AA`, 'ES256')).toBe(false);
    });

    it('throws when the public key is not defined', () => {
        jest.isolateModules(() => {
            jest.doMock('@trezor/env-utils', () => ({ getJWSPublicKey: () => undefined }));
            const { verifyJws: verifyWithoutKey } = require('./jws') as typeof JwsModule;

            expect(() => verifyWithoutKey(validJws, 'ES256')).toThrow(
                'JWS public key is not defined!',
            );
        });
    });
});
