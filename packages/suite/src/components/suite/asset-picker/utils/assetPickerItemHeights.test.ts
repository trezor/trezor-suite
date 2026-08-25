import { type Account, asAccountDescriptor, toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { getAssetPickerItemHeight } from './assetPickerItemHeights';

import { createAccountOption, createHiddenTokensOption, createTokenOption } from './index';

const account: Account = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('ethAccount'),
    balance: '1',
    formattedBalance: '1',
});

const createToken = (symbol: string, contract: string): TokensWithRates => ({
    ...mockAccountToken({
        name: symbol,
        symbol,
        contract: toTokenAddress(contract),
        balance: '20',
    }),
    fiatValue: new BigNumber('20'),
});

const usdt = createToken('USDT', '0xdac17f958d2ee523a2206206994597c13d831ec7');
const usdc = createToken('USDC', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

const createHiddenTokens = (expanded: boolean) =>
    createHiddenTokensOption({
        account,
        hiddenTokens: [usdt, usdc],
        expandedHiddenTokensGroups: expanded ? [account.key] : [],
    });

describe('getAssetPickerItemHeight', () => {
    it('gives an account row and a token row the same height', () => {
        expect(getAssetPickerItemHeight(createAccountOption(account))).toBe(68);
        expect(getAssetPickerItemHeight(createTokenOption(account, usdt))).toBe(68);
    });

    it('measures a collapsed group by its header alone', () => {
        expect(getAssetPickerItemHeight(createHiddenTokens(false))).toBe(50);
        expect(
            getAssetPickerItemHeight({
                type: 'low-balance-group',
                account,
                items: [createAccountOption(account), createTokenOption(account, usdt)],
                expanded: false,
            }),
        ).toBe(50);
    });

    it('grows an expanded group by one row height per item', () => {
        expect(getAssetPickerItemHeight(createHiddenTokens(true))).toBe(50 + 2 * 68);
        expect(
            getAssetPickerItemHeight({
                type: 'non-tradable-group',
                account,
                items: [createAccountOption(account), createTokenOption(account, usdt)],
                expanded: true,
            }),
        ).toBe(50 + 2 * 68);
    });

    it('measures the account label and the space between accounts', () => {
        expect(getAssetPickerItemHeight({ type: 'group-label', label: 'Ethereum #1' })).toBe(28);
        expect(getAssetPickerItemHeight({ type: 'group-space', size: 'md' })).toBe(24);
        expect(getAssetPickerItemHeight({ type: 'group-space', size: 'lg' })).toBe(32);
    });
});
