import { type CallMethodKeys } from '@trezor/connect';

import { addressConfirmationModalHooks } from './addressConfirmation';
import { type PostCallHookParams } from './types';

// `postCallHook` blocks on the permission deferred between its two dispatches; the hook under test
// is the address mapping, so resolve it right away.
jest.mock('../connectPopupPromiseManager', () => ({
    getPermissionDeferred: () => ({ promise: Promise.resolve() }),
}));

const run = async (method: string, payload: unknown) => {
    const dispatch = jest.fn();
    await addressConfirmationModalHooks.postCallHook({
        method,
        originalPayload: {},
        response: { success: true, payload },
        dispatch,
    } as unknown as PostCallHookParams<CallMethodKeys>);

    return dispatch.mock.calls[0]?.[0].payload.addresses.map(
        (address: { address: string }) => address.address,
    );
};

describe('addressConfirmation postCallHook', () => {
    // Documents the bug: firmware renders the taproot descriptor with `h` and a trailing
    // `#<checksum>`, the popup shows the canonical apostrophe form and drops the checksum.
    it('shows a taproot descriptor in the canonical form, unlike firmware', async () => {
        expect(
            await run('getPublicKey', {
                displayablePublicKey: "tr([95d8f670/86'/0'/0']xpub6D1sa/<0;1>/*)",
                descriptorChecksum: 'htg5lhe3',
            }),
        ).toEqual(["tr([95d8f670/86'/0'/0']xpub6D1sa/<0;1>/*)"]);
    });

    it('leaves a representation without a checksum alone', async () => {
        expect(await run('getPublicKey', { displayablePublicKey: 'zpub6rFR7y4Q2AijBE' })).toEqual([
            'zpub6rFR7y4Q2AijBE',
        ]);
    });

    it('shows addresses verbatim', async () => {
        expect(await run('getAddress', { address: 'bc1qannfxke2tfd4' })).toEqual([
            'bc1qannfxke2tfd4',
        ]);
    });

    it('maps a bundle', async () => {
        expect(
            await run('getPublicKey', [
                {
                    displayablePublicKey: "tr([95d8f670/86'/0'/0']xpub6D1sa/<0;1>/*)",
                    descriptorChecksum: 'htg5lhe3',
                },
                { displayablePublicKey: 'zpub6rFR7y4Q2AijBE' },
            ]),
        ).toEqual(["tr([95d8f670/86'/0'/0']xpub6D1sa/<0;1>/*)", 'zpub6rFR7y4Q2AijBE']);
    });
});
