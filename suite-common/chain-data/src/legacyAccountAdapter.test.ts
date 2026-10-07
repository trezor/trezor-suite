import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { toChainAccountRef, toLastKnownBalance, toPortfolioAccount } from './legacyAccountAdapter';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('zpub'),
    accountType: 'normal',
    deviceState: 'session@device:0',
    balance: '150000000',
    availableBalance: '100000000',
    formattedBalance: '1',
    empty: false,
});

describe('legacy account adapter', () => {
    it('reads the chain account behind a Redux account', () => {
        expect(toChainAccountRef(account)).toEqual({
            symbol: 'btc',
            descriptor: 'zpub',
            accountType: 'normal',
            connectionIdentity: 'session@device:0',
        });
    });

    it.each([
        ['a failed account', { ...account, failed: true }],
        ['a CoinJoin account', { ...account, backendType: 'coinjoin' as const }],
    ])('leaves out %s', (_, legacyAccount) => {
        expect(toChainAccountRef(legacyAccount)).toBeNull();
        expect(toPortfolioAccount(legacyAccount)).toBeNull();
    });

    it('makes a single-chain portfolio account keyed like the Redux one', () => {
        expect(toPortfolioAccount(account)).toEqual({
            id: account.key,
            chainAccounts: [toChainAccountRef(account)],
        });
    });

    it('converts the stored balance to whole coins', () => {
        expect(toLastKnownBalance(account)).toEqual({
            balance: '1.5',
            availableBalance: '1',
            displayBalance: '1',
            empty: false,
        });
    });
});
