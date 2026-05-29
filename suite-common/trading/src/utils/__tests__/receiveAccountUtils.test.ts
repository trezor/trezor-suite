import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getReceiveAccountPreselection } from '../receiveAccountUtils';

const btcUnusedAddress = 'bc1qfcjv620stvtzjeelg26ncgww8ks49zy8lracjz';

const btcAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btc-descriptor'),
    addresses: {
        change: [],
        used: [],
        unused: [
            {
                address: btcUnusedAddress,
                path: "m/84'/0'/0'/0/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
    },
});

const ethAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('0x0000000000000000000000000000000000000001'),
});

describe('getReceiveAccountPreselection', () => {
    it('returns null when there are no accounts', () => {
        expect(
            getReceiveAccountPreselection({ receiveAssetNetworkSymbol: 'btc', accounts: [] }),
        ).toBeNull();
    });

    it('returns the send account key when send account has the receive symbol', () => {
        const sendAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('eth-send-descriptor'),
        });

        expect(
            getReceiveAccountPreselection({
                receiveAssetNetworkSymbol: 'eth',
                accounts: [ethAccount],
                sendAccount,
            }),
        ).toEqual({
            accountKey: sendAccount.key,
            address: sendAccount.descriptor,
        });
    });

    it('returns the first unused address for non-account-based networks', () => {
        expect(
            getReceiveAccountPreselection({
                receiveAssetNetworkSymbol: 'btc',
                accounts: [btcAccount],
            }),
        ).toEqual({
            accountKey: btcAccount.key,
            address: btcUnusedAddress,
        });
    });
});
