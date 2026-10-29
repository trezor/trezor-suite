import { type CallMethodKeys } from '@trezor/connect';

import { type PopupFlowParams, type PopupFlowPayload } from '../CommonPopupFlow';
import { applyRequestCompatibility } from './compatibility';
import { type ManifestPartial } from '../../connectPopupTypes';

// Only host apps still on `@trezor/connect` 9.x get the getPublicKey compatibility flag.
const v9Manifest: ManifestPartial = { appName: 'app', npmVersion: '9.4.2' };

type CreateParamsParams = {
    method: CallMethodKeys;
    // Legacy and malformed payloads are not representable by the current payload types.
    payload: unknown;
    manifest?: ManifestPartial;
};

const createParams = ({
    method,
    payload,
    manifest = v9Manifest,
}: CreateParamsParams): PopupFlowParams<CallMethodKeys> => ({
    method,
    payload: payload as PopupFlowPayload<CallMethodKeys>,
    source: { type: 'web', origin: 'https://app.example', manifest },
});

describe('applyRequestCompatibility', () => {
    describe('getPublicKey', () => {
        it('sets the _v9_compat flag on a non-bitcoin getPublicKey for 9.x callers', () => {
            const payload = { path: "m/44'/195'/0'/0/0", coin: 'trx' };

            expect(
                applyRequestCompatibility(createParams({ method: 'getPublicKey', payload })),
            ).toEqual(
                createParams({ method: 'getPublicKey', payload: { ...payload, _v9_compat: true } }),
            );
        });

        it('sets the flag on a bitcoin getPublicKey too (no-op for such calls)', () => {
            const payload = { path: "m/49'/0'/0'", coin: 'btc' };

            expect(
                applyRequestCompatibility(createParams({ method: 'getPublicKey', payload })),
            ).toEqual(
                createParams({ method: 'getPublicKey', payload: { ...payload, _v9_compat: true } }),
            );
        });

        it('sets the flag on a bundle getPublicKey', () => {
            const payload = {
                bundle: [
                    { path: "m/44'/195'/0'/0/0", coin: 'trx' },
                    { path: "m/49'/0'/0'", coin: 'btc' },
                ],
            };

            expect(
                applyRequestCompatibility(createParams({ method: 'getPublicKey', payload })),
            ).toEqual(
                createParams({ method: 'getPublicKey', payload: { ...payload, _v9_compat: true } }),
            );
        });

        it.each([
            ['a non-9.x caller', { appName: 'app', npmVersion: '10.0.0' }],
            ['a caller reporting no npmVersion', { appName: 'app' }],
        ])('leaves the call of %s untouched', (_name, manifest) => {
            const params = createParams({
                method: 'getPublicKey',
                payload: { path: "m/44'/195'/0'/0/0", coin: 'trx' },
                manifest,
            });

            expect(applyRequestCompatibility(params)).toBe(params);
        });
    });

    it('leaves other methods untouched', () => {
        const params = createParams({
            method: 'getAddress',
            payload: { path: "m/44'/195'/0'/0/0", coin: 'trx' },
        });

        expect(applyRequestCompatibility(params)).toBe(params);
    });
});
