import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getChooseAccountBalanceData } from './chooseAccountBalanceUtils';

const ethSymbol = asNetworkSymbol('eth');

const WETH_ADDRESS = toTokenAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
const USDC_ADDRESS = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

describe(getChooseAccountBalanceData.name, () => {
    it('returns the account balance when no token balance is requested', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '1.5',
        });

        expect(getChooseAccountBalanceData(account)).toEqual({
            type: 'account',
            value: '1.5',
        });
    });

    it('combines the token balance with the full native balance for a wrapped-native vault, denominated as native', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '1',
            tokens: [mockAccountToken({ contract: WETH_ADDRESS, balance: '0.5' })],
        });

        expect(
            getChooseAccountBalanceData(account, {
                tokenContractAddress: WETH_ADDRESS,
                tokenSymbol: toTokenSymbol('WETH'),
            }),
        ).toEqual({
            type: 'account',
            value: '1.5',
        });
    });

    it('counts a native-only account (no WETH token) as depositable for a wrapped-native vault', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '1',
        });

        expect(
            getChooseAccountBalanceData(account, {
                tokenContractAddress: WETH_ADDRESS,
                tokenSymbol: toTokenSymbol('WETH'),
            }),
        ).toEqual({
            type: 'account',
            value: '1',
        });
    });

    it('keeps the token denomination for a non-wrapped-native vault', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '1',
            tokens: [mockAccountToken({ contract: USDC_ADDRESS, balance: '100' })],
        });

        expect(
            getChooseAccountBalanceData(account, {
                tokenContractAddress: USDC_ADDRESS,
                tokenSymbol: toTokenSymbol('USDC'),
            }),
        ).toEqual({
            type: 'token',
            value: '100',
            tokenContractAddress: USDC_ADDRESS,
            tokenSymbol: 'USDC',
        });
    });
});
