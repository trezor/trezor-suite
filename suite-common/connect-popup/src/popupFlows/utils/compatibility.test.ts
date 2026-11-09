import { type CallMethodKeys, type CardanoPublicKey } from '@trezor/connect';
import { type Ok } from '@trezor/type-utils';

import { type PopupFlowParams, type PopupFlowPayload } from '../CommonPopupFlow';
import { applyRequestCompatibility, applyResponseCompatibility } from './compatibility';
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
            // Host apps report the version unvalidated.
            ['a caller reporting a non-string npmVersion', { appName: 'app', npmVersion: 9 }],
        ])('leaves the call of %s untouched', (_name, manifest) => {
            const params = createParams({
                method: 'getPublicKey',
                payload: { path: "m/44'/195'/0'/0/0", coin: 'trx' },
                manifest: manifest as ManifestPartial,
            });

            expect(applyRequestCompatibility(params)).toBe(params);
        });
    });

    describe('getAccountInfo', () => {
        const payload = { path: "m/44'/60'/0'", coin: 'btc' };

        it('sets the _v9_compat flag for 9.x callers', () => {
            expect(
                applyRequestCompatibility(createParams({ method: 'getAccountInfo', payload })),
            ).toEqual(
                createParams({
                    method: 'getAccountInfo',
                    payload: { ...payload, _v9_compat: true },
                }),
            );
        });

        it('leaves the call of a non-9.x caller untouched', () => {
            const params = createParams({
                method: 'getAccountInfo',
                payload,
                manifest: { appName: 'app', npmVersion: '10.0.0' },
            });

            expect(applyRequestCompatibility(params)).toBe(params);
        });
    });

    describe('composeTransaction', () => {
        const outputs = [{ type: 'payment', address: 'bc1qrecipient', amount: '1000' }];

        it('leaves a call with current params untouched', () => {
            const params = createParams({
                method: 'composeTransaction',
                payload: { coin: 'btc', outputs, path: "m/84'/0'/0'" },
            });

            expect(applyRequestCompatibility(params)).toBe(params);
        });

        it('replaces the legacy account param with path, utxo and an unused change address', () => {
            const usedChange = { address: 'bc1qused', path: "m/84'/0'/0'/1/0", transfers: 2 };
            const unusedChange = { address: 'bc1qunused', path: "m/84'/0'/0'/1/1", transfers: 0 };
            const params = createParams({
                method: 'composeTransaction',
                payload: {
                    coin: 'btc',
                    outputs,
                    account: {
                        path: "m/84'/0'/0'",
                        utxo: [],
                        addresses: { used: [], unused: [], change: [usedChange, unusedChange] },
                    },
                },
            });

            expect(applyRequestCompatibility(params)).toEqual(
                createParams({
                    method: 'composeTransaction',
                    payload: {
                        coin: 'btc',
                        outputs,
                        path: "m/84'/0'/0'",
                        utxo: [],
                        changeAddress: unusedChange,
                    },
                }),
            );
        });

        it.each([
            ['a non-object payload', null],
            [
                'a legacy account with malformed change addresses',
                {
                    coin: 'btc',
                    outputs,
                    account: { path: "m/84'/0'/0'", addresses: { change: [null] } },
                },
            ],
        ])('leaves %s for Connect to reject', (_name, payload) => {
            const params = createParams({ method: 'composeTransaction', payload });

            expect(applyRequestCompatibility(params)).toBe(params);
        });

        it('turns the deprecated interactive call into sendTransaction', () => {
            const payload = { coin: 'btc', outputs };

            expect(
                applyRequestCompatibility(createParams({ method: 'composeTransaction', payload })),
            ).toEqual(createParams({ method: 'sendTransaction', payload }));
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

describe('applyResponseCompatibility', () => {
    const createCardanoPublicKey = (xpub: string): CardanoPublicKey => ({
        publicKey: 'raw-public-key',
        path: [2147485500, 2147485463, 2147483648],
        serializedPath: "m/1852'/1815'/0'",
        displayablePublicKey: xpub,
        xpub,
        node: { depth: 3, fingerprint: 0, child_num: 0, chain_code: '', public_key: '' },
    });

    it('rewrites publicKey to the xpub of a single or bundled cardanoGetPublicKey for 9.x callers', () => {
        const params = createParams({
            method: 'cardanoGetPublicKey',
            payload: { path: "m/1852'/1815'/0'" },
        });
        const single: Ok<CardanoPublicKey> = {
            success: true,
            payload: createCardanoPublicKey('xpub-single'),
        };
        const bundled: Ok<CardanoPublicKey[]> = {
            success: true,
            payload: [createCardanoPublicKey('xpub-first'), createCardanoPublicKey('xpub-second')],
        };

        expect(applyResponseCompatibility(params, single)).toEqual({
            success: true,
            payload: { ...single.payload, publicKey: 'xpub-single' },
        });
        expect(applyResponseCompatibility(params, bundled)).toEqual({
            success: true,
            payload: bundled.payload.map(publicKey => ({
                ...publicKey,
                publicKey: publicKey.xpub,
            })),
        });
    });

    it('does not mutate the original response', () => {
        const params = createParams({
            method: 'cardanoGetPublicKey',
            payload: { path: "m/1852'/1815'/0'" },
        });
        const response: Ok<CardanoPublicKey> = {
            success: true,
            payload: createCardanoPublicKey('xpub-single'),
        };

        applyResponseCompatibility(params, response);

        expect(response.payload.publicKey).toBe('raw-public-key');
    });

    it('leaves the response of a non-9.x caller untouched', () => {
        const params = createParams({
            method: 'cardanoGetPublicKey',
            payload: { path: "m/1852'/1815'/0'" },
            manifest: { appName: 'app', npmVersion: '10.0.0' },
        });
        const response: Ok<CardanoPublicKey> = {
            success: true,
            payload: createCardanoPublicKey('xpub-single'),
        };

        expect(applyResponseCompatibility(params, response)).toBe(response);
    });
});
