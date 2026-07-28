import { type TokenDefinition } from '@suite-common/token-definitions';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getAccountAnalyticsTokenSymbols } from './tokenUtils';

const legitContract = '0x' + 'a'.repeat(40);
const spamContract = '0x' + 'b'.repeat(40);
const hiddenContract = '0x' + 'c'.repeat(40);
const zeroBalanceContract = '0x' + 'e'.repeat(40);

const ethDefinitions: TokenDefinition = {
    error: false,
    isLoading: false,
    data: [legitContract, hiddenContract, zeroBalanceContract],
    hide: [hiddenContract],
    show: [],
};

describe('getAccountAnalyticsTokenSymbols', () => {
    it('lists the native token first when the account holds a native balance', () => {
        const account = mockWalletAccount({ symbol: 'eth', balance: '1000', tokens: [] });

        expect(getAccountAnalyticsTokenSymbols(account, ethDefinitions)).toEqual(['ETH']);
    });

    it('omits the native token when the native balance is zero', () => {
        const account = mockWalletAccount({
            symbol: 'eth',
            balance: '0',
            tokens: [mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' })],
        });

        expect(getAccountAnalyticsTokenSymbols(account, ethDefinitions)).toEqual(['USDC']);
    });

    it('includes only legit tokens with balance, native first', () => {
        const account = mockWalletAccount({
            symbol: 'eth',
            balance: '1000',
            tokens: [
                mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' }),
                mockAccountToken({ symbol: 'SPAM', contract: spamContract, balance: '100' }),
                mockAccountToken({ symbol: 'HIDDEN', contract: hiddenContract, balance: '100' }),
                mockAccountToken({ symbol: 'ZERO', contract: zeroBalanceContract, balance: '0' }),
            ],
        });

        expect(getAccountAnalyticsTokenSymbols(account, ethDefinitions)).toEqual(['ETH', 'USDC']);
    });

    it('deduplicates repeated token symbols', () => {
        const otherLegitContract = '0x' + 'd'.repeat(40);
        const definitions: TokenDefinition = {
            error: false,
            isLoading: false,
            data: [legitContract, otherLegitContract],
            hide: [],
            show: [],
        };
        const account = mockWalletAccount({
            symbol: 'eth',
            balance: '0',
            tokens: [
                mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' }),
                mockAccountToken({ symbol: 'USDC', contract: otherLegitContract, balance: '50' }),
            ],
        });

        expect(getAccountAnalyticsTokenSymbols(account, definitions)).toEqual(['USDC']);
    });

    it('omits definition-dependent tokens until token definitions are loaded', () => {
        const account = mockWalletAccount({
            symbol: 'eth',
            balance: '1000',
            tokens: [mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' })],
        });

        expect(getAccountAnalyticsTokenSymbols(account, undefined)).toEqual(['ETH']);
    });
});
