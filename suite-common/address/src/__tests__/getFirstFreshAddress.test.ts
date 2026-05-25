import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getFirstFreshAddress } from '../getFirstFreshAddress';

describe(getFirstFreshAddress.name, () => {
    it('returns the first unrevealed unused address for utxo-based accounts', () => {
        const account = mockWalletAccount({
            symbol: 'test',
            path: "m/84'/1'/0'",
            descriptor: asAccountDescriptor('descriptor-test'),
            history: { total: 13, tokens: 0, unconfirmed: 0 },
            addresses: {
                used: [],
                unused: [
                    {
                        address: 'tb1q-first',
                        path: "m/84'/1'/0'/0/1",
                        balance: '0',
                        sent: '0',
                        received: '0',
                        transfers: 0,
                    },
                    {
                        address: 'tb1q-second',
                        path: "m/84'/1'/0'/0/2",
                        balance: '0',
                        sent: '0',
                        received: '0',
                        transfers: 0,
                    },
                ],
                change: [],
            },
        });

        expect(
            getFirstFreshAddress(
                account,
                [
                    {
                        path: "m/84'/1'/0'/0/1",
                        address: 'tb1q-first',
                        isVerified: true,
                    },
                ],
                ['tb1q-first'],
                true,
            ),
        ).toEqual({
            address: 'tb1q-second',
            balance: '0',
            path: "m/84'/1'/0'/0/2",
            received: '0',
            sent: '0',
            transfers: 0,
        });
    });

    it('returns the descriptor-based receive address for non-utxo accounts', () => {
        const account = mockWalletAccount({
            symbol: 'xrp',
            path: "m/44'/144'/0'/0/0",
            descriptor: asAccountDescriptor('rXrpDescriptor'),
            history: { total: 7, tokens: 0, unconfirmed: 0 },
            addresses: undefined,
        });

        expect(getFirstFreshAddress(account, [], [], false)).toEqual({
            path: "m/44'/144'/0'/0/0",
            address: 'rXrpDescriptor',
            transfers: 7,
        });
    });

    it('returns undefined when all unused utxo addresses are already revealed or pending', () => {
        const account = mockWalletAccount({
            symbol: 'test',
            path: "m/84'/1'/0'",
            descriptor: asAccountDescriptor('descriptor-test'),
            history: { total: 13, tokens: 0, unconfirmed: 0 },
            addresses: {
                used: [],
                unused: [
                    {
                        address: 'tb1q-first',
                        path: "m/84'/1'/0'/0/1",
                        balance: '0',
                        sent: '0',
                        received: '0',
                        transfers: 0,
                    },
                ],
                change: [],
            },
        });

        expect(
            getFirstFreshAddress(
                account,
                [
                    {
                        path: "m/84'/1'/0'/0/1",
                        address: 'tb1q-first',
                        isVerified: true,
                    },
                ],
                ['tb1q-first'],
                true,
            ),
        ).toBeUndefined();
    });
});
