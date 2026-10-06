import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getReceiveAccountPreselection } from './receiveAccountUtils';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

const btcUnusedAddress = 'bc1qfcjv620stvtzjeelg26ncgww8ks49zy8lracjz';

const btcAccount = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('btcDescriptor'),
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
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0x0000000000000000000000000000000000000001'),
});

describe('getReceiveAccountPreselection', () => {
    it('returns null when there are no accounts', () => {
        expect(
            getReceiveAccountPreselection({ receiveAssetNetworkSymbol: btcSymbol, accounts: [] }),
        ).toBeNull();
    });

    it('returns the send account key when send account has the receive symbol', () => {
        const sendAccount = mockWalletAccount({
            symbol: ethSymbol,
            descriptor: asAccountDescriptor('ethSendDescriptor'),
        });

        expect(
            getReceiveAccountPreselection({
                receiveAssetNetworkSymbol: ethSymbol,
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
                receiveAssetNetworkSymbol: btcSymbol,
                accounts: [btcAccount],
            }),
        ).toEqual({
            accountKey: btcAccount.key,
            address: btcUnusedAddress,
        });
    });
});
