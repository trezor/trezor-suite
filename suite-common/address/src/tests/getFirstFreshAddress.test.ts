import { type ReceiveInfo, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getFirstFreshAddress } from '../getFirstFreshAddress';

const utxoAccount = {
    ...mockWalletAccount({
        symbol: 'btc',
        path: "m/84'/1'/0'",
        descriptor: asAccountDescriptor('descriptor'),
        history: { total: 0, unconfirmed: 0 },
    }),
    addresses: {
        used: [],
        unused: [
            {
                address: 'tb1-first',
                path: "m/84'/1'/0'/0/1",
                balance: '0',
                sent: '0',
                received: '0',
                transfers: 0,
            },
            {
                address: 'tb1-second',
                path: "m/84'/1'/0'/0/2",
                balance: '0',
                sent: '0',
                received: '0',
                transfers: 0,
            },
        ],
        change: [],
    },
};

const addressBasedAccount = mockWalletAccount({
    symbol: 'xrp',
    path: "m/44'/144'/0'/0/0",
    descriptor: asAccountDescriptor('rAddress'),
    history: { total: 4, unconfirmed: 0 },
});

describe(getFirstFreshAddress.name, () => {
    it('returns the first unused utxo address when nothing is revealed', () => {
        expect(getFirstFreshAddress(utxoAccount, [], [], true)).toMatchObject({
            address: 'tb1-first',
            path: "m/84'/1'/0'/0/1",
            transfers: 0,
        });
    });

    it('skips revealed or pending utxo addresses', () => {
        const receiveAddresses = [{ path: "m/84'/1'/0'/0/1" }] as ReceiveInfo[];

        expect(
            getFirstFreshAddress(utxoAccount, receiveAddresses, ['tb1-first'], true),
        ).toMatchObject({
            address: 'tb1-second',
            path: "m/84'/1'/0'/0/2",
            transfers: 0,
        });
    });

    it('falls back to descriptor for address-based accounts', () => {
        expect(getFirstFreshAddress(addressBasedAccount, [], [], false)).toEqual({
            address: 'rAddress',
            path: "m/44'/144'/0'/0/0",
            transfers: 4,
        });
    });
});
