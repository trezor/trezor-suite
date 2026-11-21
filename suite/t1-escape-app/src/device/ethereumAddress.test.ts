import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { ok } from '@trezor/type-utils';

import { createDeviceSession } from './deviceSession';
import { getEthereumAddress } from './ethereumAddress';
import { mockDevice } from '../../mocks/mockDevice';
import { mockWallet } from '../../mocks/mockWallet';
import { getEthereumAddressPath } from '../ethereum/ethereumChain';

const PATH = getEthereumAddressPath(60, 3);

describe('getEthereumAddress', () => {
    it('asks without show_display and returns the address checksummed', async () => {
        const wallet = mockWallet();
        const device = mockDevice({ wallets: { '': wallet } });
        const session = createDeviceSession({
            transportCall: device.transportCall,
            getDeviceLostReason: () => undefined,
            requestPin: () => Promise.resolve(undefined),
            requestPassphrase: () => Promise.resolve(undefined),
            onButtonRequest: () => undefined,
        });

        const address = await getEthereumAddress({ call: session.call, path: PATH });

        expect(address).toEqual({ success: true, payload: wallet.getEthereumAddress(PATH) });
        expect(device.calls).toEqual([{ name: 'EthereumGetAddress', data: { address_n: PATH } }]);
    });

    it.each(['', 'd8da6bf26964af9d7eed9e03e53415d37aa960', 'zz'.repeat(20), undefined])(
        'refuses an answer whose address is %j',
        async address => {
            const session = createDeviceSession({
                // Deliberately malformed answers, which the message type cannot express.
                transportCall: () =>
                    Promise.resolve(
                        ok({
                            type: 'EthereumAddress',
                            message: { address },
                        } as unknown as PROTO.MessageResponse),
                    ),
                getDeviceLostReason: () => undefined,
                requestPin: () => Promise.resolve(undefined),
                requestPassphrase: () => Promise.resolve(undefined),
                onButtonRequest: () => undefined,
            });

            expect(await getEthereumAddress({ call: session.call, path: PATH })).toEqual({
                success: false,
                error: { type: 'address-invalid' },
            });
        },
    );
});
