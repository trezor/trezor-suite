import { CARDANO, asDeviceUniquePath } from '@trezor/connect-common';
import { createMockDeps } from '@trezor/dependency-injection';

import { type SignCardanoMessageDeps, createSignCardanoMessage } from './createSignCardanoMessage';

const deps = createMockDeps<SignCardanoMessageDeps>({
    getTrezorConnect: () => ({
        cardanoSignMessage: () =>
            Promise.resolve({
                success: true,
                payload: {
                    headers: {
                        protected: { 1: CARDANO.ALGORITHM_IDS.EdDSA, address: 'ADDRESS' },
                        unprotected: { hashed: false, version: 1 },
                    },
                    payload: 'PAYLOAD',
                    signature: 'SIGNATURE',
                    pubKey: 'RAW_PUBLIC_KEY',
                    coseSignature: 'COSE_SIGNATURE',
                    coseKey: 'COSE_PUBLIC_KEY',
                },
            }),
    }),
});

describe(createSignCardanoMessage.name, () => {
    it.each([
        { format: 'raw', pubKey: 'RAW_PUBLIC_KEY' },
        { format: 'cose', pubKey: 'COSE_PUBLIC_KEY' },
    ] as const)('returns the selected $format public key', async ({ format, pubKey }) => {
        const result = await createSignCardanoMessage(deps)('ada', {
            device: { path: asDeviceUniquePath('DEVICE_PATH') },
            accountIndex: 0,
            accountType: 'normal',
            path: "m/1852'/1815'/0'/0/0",
            message: 'MESSAGE',
            hex: false,
            format,
        });

        expect(result).toEqual({
            success: true,
            payload: { signature: 'COSE_SIGNATURE', pubKey, address: 'ADDRESS' },
        });
    });
});
