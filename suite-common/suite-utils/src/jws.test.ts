import type * as JwsModule from './jws';
import { decodeJws, verifyJws } from './jws';

// Signed by the message-system dev private key, payload: {"version":1,"timestamp":"2021-03-03T03:48:16+00:00","sequence":1,"actions":[]}
const validJws =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEsCiAgICAiYWN0aW9ucyI6IFtdCn0K.Qtemcj062ih5j2F7SaMw1Sgms8jhuo-312f9_2unPzLWKrewQNwaHxyZsZCk3M_6r4CKRcHsSzRTYNOF8k2W9A';

const [header = '', payload = '', signature = ''] = validJws.split('.');

describe('verifyJws', () => {
    it('accepts a config signed by the dev key', async () => {
        await expect(verifyJws(validJws, 'ES256')).resolves.toBe(true);
    });

    it('rejects a tampered payload', async () => {
        await expect(verifyJws(`${header}.${payload}A.${signature}`, 'ES256')).resolves.toBe(false);
    });

    it('rejects a tampered signature', async () => {
        await expect(
            verifyJws(`${header}.${payload}.${signature.slice(0, -2)}AA`, 'ES256'),
        ).resolves.toBe(false);
    });

    it('throws when the public key is not defined', async () => {
        await jest.isolateModulesAsync(async () => {
            jest.doMock('@trezor/env-utils', () => ({ getJWSPublicKey: () => undefined }));
            const { verifyJws: verifyWithoutKey } = require('./jws') as typeof JwsModule;

            await expect(verifyWithoutKey(validJws, 'ES256')).rejects.toThrow(
                'JWS public key is not defined!',
            );
        });
    });
});

describe('decodeJws', () => {
    it('decodes the header and payload', async () => {
        const decoded = await decodeJws(validJws);

        expect(decoded?.header.alg).toBe('ES256');
        expect(JSON.parse(decoded?.payload ?? '')).toMatchObject({ version: 1, sequence: 1 });
    });

    it('rejects when the JWS library fails to load', async () => {
        await jest
            .isolateModulesAsync(async () => {
                jest.doMock('jws', () => {
                    throw new Error('Loading chunk failed');
                });
                const isolated = require('./jws') as typeof JwsModule;

                await expect(isolated.preloadJws()).rejects.toThrow('Loading chunk failed');
                await expect(isolated.decodeJws(validJws)).rejects.toThrow('Loading chunk failed');
            })
            .finally(() => {
                // The mock factory outlives the isolated registry, and the other tests load `jws` lazily.
                jest.dontMock('jws');
            });

        await expect(decodeJws(validJws)).resolves.toMatchObject({ header: { alg: 'ES256' } });
    });
});
