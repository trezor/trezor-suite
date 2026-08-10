import { type CallMethodKeys } from '@trezor/connect';

import { ethereumGetPublicKeyCompat } from './ethereumGetPublicKeyCompat';
import { type CompatibilityHookParams } from './types';

// Only host apps still on `@trezor/connect` 9.x get the compatibility rewrite.
const v9Source = { manifest: { appName: 'app', npmVersion: '9.4.2' } };

const run = (
    params: Omit<CompatibilityHookParams<CallMethodKeys>, 'source'>,
    source: { manifest: { appName: string; npmVersion?: string } } = v9Source,
) => ethereumGetPublicKeyCompat.compatibilityHook({ ...params, source } as any);

describe('ethereumGetPublicKeyCompat', () => {
    it('rewrites an ethereum-coin getPublicKey to ethereumGetPublicKey for 9.x callers', () => {
        const payload = { path: "m/44'/60'/0'/0/0", coin: 'eth' };

        expect(run({ method: 'getPublicKey', payload } as any)).toEqual({
            method: 'ethereumGetPublicKey',
            payload,
        });
    });

    it('is case-insensitive on the coin symbol', () => {
        const payload = { path: "m/44'/60'/0'/0/0", coin: 'ETH' };

        expect(run({ method: 'getPublicKey', payload } as any)).toEqual({
            method: 'ethereumGetPublicKey',
            payload,
        });
    });

    it('leaves the call untouched for non-9.x callers', () => {
        const payload = { path: "m/44'/60'/0'/0/0", coin: 'eth' };
        const v10Source = { manifest: { appName: 'app', npmVersion: '10.0.0' } };

        expect(run({ method: 'getPublicKey', payload } as any, v10Source)).toBeUndefined();
    });

    it('leaves the call untouched when the caller reports no npmVersion', () => {
        const payload = { path: "m/44'/60'/0'/0/0", coin: 'eth' };
        const noVersionSource = { manifest: { appName: 'app' } };

        expect(run({ method: 'getPublicKey', payload } as any, noVersionSource)).toBeUndefined();
    });

    it('leaves bitcoin-coin getPublicKey untouched', () => {
        expect(
            run({ method: 'getPublicKey', payload: { path: "m/49'/0'/0'", coin: 'btc' } } as any),
        ).toBeUndefined();
    });

    it('leaves a path-only (no coin) getPublicKey untouched', () => {
        expect(
            run({ method: 'getPublicKey', payload: { path: "m/49'/0'/0'" } } as any),
        ).toBeUndefined();
    });

    it('leaves non-getPublicKey methods untouched', () => {
        expect(
            run({
                method: 'getAddress',
                payload: { path: "m/44'/60'/0'/0/0", coin: 'eth' },
            } as any),
        ).toBeUndefined();
    });

    it('rewrites a bundle when every batch is an ethereum coin', () => {
        const payload = {
            bundle: [
                { path: "m/44'/60'/0'/0/0", coin: 'eth' },
                { path: "m/44'/60'/0'/0/1", coin: 'eth' },
            ],
        };

        expect(run({ method: 'getPublicKey', payload } as any)).toEqual({
            method: 'ethereumGetPublicKey',
            payload,
        });
    });

    it('leaves a mixed bundle untouched', () => {
        const payload = {
            bundle: [
                { path: "m/44'/60'/0'/0/0", coin: 'eth' },
                { path: "m/49'/0'/0'", coin: 'btc' },
            ],
        };

        expect(run({ method: 'getPublicKey', payload } as any)).toBeUndefined();
    });

    it('leaves an empty bundle untouched', () => {
        expect(run({ method: 'getPublicKey', payload: { bundle: [] } } as any)).toBeUndefined();
    });
});
