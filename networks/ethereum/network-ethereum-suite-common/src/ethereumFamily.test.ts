import { type DeviceIdentity, asDeviceUniquePath } from '@trezor/connect-common';
import { mock } from '@trezor/dependency-injection';
import type { OpenAccount } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type EthereumFamilyDeps, ethereumFamily } from './ethereumFamily';

type EthereumConnect = ReturnType<EthereumFamilyDeps['getTrezorConnect']>;

const DEVICE_PATH = asDeviceUniquePath('1');
const DEVICE: DeviceIdentity = { path: DEVICE_PATH, instance: 0 };

const account: OpenAccount = {
    symbol: asNetworkSymbol('eth'),
    accountType: 'normal',
    index: 0,
    path: "m/44'/60'/0'/0/0",
    descriptor: '0xAccount',
};

const createConnect = () => ({
    ethereumSignMessage: mock<EthereumConnect['ethereumSignMessage']>(),
    ethereumVerifyMessage: mock<EthereumConnect['ethereumVerifyMessage']>(),
    // Not exercised here; a plain stub satisfies both overloads of the method.
    ethereumGetAddress: (): never => {
        throw new Error('ethereumGetAddress is not expected to be called.');
    },
});

const createDeps = (connect: ReturnType<typeof createConnect>): EthereumFamilyDeps => ({
    getTrezorConnect: () => connect,
});

describe('ethereumFamily message signing', () => {
    it('is available whether the network is served by Blockbook or a custom RPC', () => {
        const deps = createDeps(createConnect());

        for (const backend of ['blockbook', 'evm-rpc'] as const) {
            const { capabilities } = ethereumFamily.createNetwork(deps, { symbol: 'eth', backend });

            expect(capabilities.messageSigning?.verify).toBeDefined();
        }
    });

    it('signs with the account address alone', async () => {
        const connect = createConnect();
        connect.ethereumSignMessage.mockResolvedValue({
            success: true,
            payload: { address: '0xAccount', signature: '0xSignature' },
            device: { path: DEVICE_PATH, state: undefined },
        });
        const { messageSigning } = ethereumFamily.createNetwork(createDeps(connect), {
            symbol: 'eth',
            backend: 'blockbook',
        }).capabilities;

        expect(messageSigning?.addressSelection).toBe('fixed');
        expect(messageSigning?.getFormatChoice(account)).toBeNull();
        expect(messageSigning?.getSignAddressGroups({ account, touchedAddresses: [] })).toEqual([
            {
                category: 'account',
                label: null,
                addresses: [{ path: account.path, address: '0xAccount' }],
            },
        ]);

        const result = await messageSigning?.sign({
            device: DEVICE,
            account,
            path: account.path,
            message: '0xdead',
            isHex: true,
        });

        expect(result).toEqual({
            success: true,
            payload: { signature: '0xSignature', address: '0xAccount' },
        });
        expect(connect.ethereumSignMessage).toHaveBeenCalledWith({
            device: DEVICE,
            path: account.path,
            message: '0xdead',
            hex: true,
        });
    });
});
