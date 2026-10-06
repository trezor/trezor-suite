import { type CallMethodKeys } from '@trezor/connect';

import { getPublicKeyV9Compat } from './getPublicKeyV9Compat';
import { type CompatibilityHookParams } from './types';

// Only host apps still on `@trezor/connect` 9.x get the compatibility flag.
const v9Source = { manifest: { appName: 'app', npmVersion: '9.4.2' } };

const run = (
    params: Omit<CompatibilityHookParams<CallMethodKeys>, 'source'>,
    source: { manifest: { appName: string; npmVersion?: string } } = v9Source,
) => getPublicKeyV9Compat.compatibilityHook({ ...params, source } as any);

describe('getPublicKeyV9Compat', () => {
    it('sets the _v9_compat flag on a non-bitcoin getPublicKey for 9.x callers', () => {
        const payload = { path: "m/44'/195'/0'/0/0", coin: 'trx' };

        expect(run({ method: 'getPublicKey', payload } as any)).toEqual({
            method: 'getPublicKey',
            payload: { ...payload, _v9_compat: true },
        });
    });

    it('sets the flag on a bitcoin getPublicKey too (no-op for such calls)', () => {
        const payload = { path: "m/49'/0'/0'", coin: 'btc' };

        expect(run({ method: 'getPublicKey', payload } as any)).toEqual({
            method: 'getPublicKey',
            payload: { ...payload, _v9_compat: true },
        });
    });

    it('sets the flag on a bundle getPublicKey', () => {
        const payload = {
            bundle: [
                { path: "m/44'/195'/0'/0/0", coin: 'trx' },
                { path: "m/49'/0'/0'", coin: 'btc' },
            ],
        };

        expect(run({ method: 'getPublicKey', payload } as any)).toEqual({
            method: 'getPublicKey',
            payload: { ...payload, _v9_compat: true },
        });
    });

    it('leaves the call untouched for non-9.x callers', () => {
        const payload = { path: "m/44'/195'/0'/0/0", coin: 'trx' };
        const v10Source = { manifest: { appName: 'app', npmVersion: '10.0.0' } };

        expect(run({ method: 'getPublicKey', payload } as any, v10Source)).toBeUndefined();
    });

    it('leaves the call untouched when the caller reports no npmVersion', () => {
        const payload = { path: "m/44'/195'/0'/0/0", coin: 'trx' };
        const noVersionSource = { manifest: { appName: 'app' } };

        expect(run({ method: 'getPublicKey', payload } as any, noVersionSource)).toBeUndefined();
    });

    it('leaves non-getPublicKey methods untouched', () => {
        expect(
            run({
                method: 'getAddress',
                payload: { path: "m/44'/195'/0'/0/0", coin: 'trx' },
            } as any),
        ).toBeUndefined();
    });
});
