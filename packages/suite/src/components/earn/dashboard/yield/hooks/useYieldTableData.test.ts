import { renderHook } from '@testing-library/react';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getYieldOpportunityData, useYieldTableData } from './useYieldTableData';

jest.mock('src/hooks/suite', () => ({
    useSelector: () => [],
}));

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const createMockVault = (
    id: string,
    token: { address: string; symbol: string; name: string; decimals: number },
): YieldDtoV2 =>
    ({
        id,
        network: 'ethereum',
        chainId: 1,
        providerId: 'morpho',
        metadata: {
            name: `${token.name} Vault`,
            underMaintenance: false,
            deprecated: false,
        },
        token: { ...token, network: 'ethereum' },
        outputToken: {
            address: '0xde6c23e561f3e55846207ec45a91b777e0f7c889',
            symbol: `tr${token.symbol}p`,
            name: `Trezor ${token.name} Prime`,
            decimals: 18,
            network: 'ethereum',
        },
        rewardRate: {
            total: 0.05,
            rateType: 'APY',
            components: [],
        },
        status: {
            enter: true,
            exit: true,
        },
    }) satisfies YieldDtoV2 as unknown as YieldDtoV2;

const wethVault = createMockVault('ethereum-weth-vault', {
    address: WETH_ADDRESS,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
});

const usdcVault = createMockVault('ethereum-usdc-vault', {
    address: USDC_ADDRESS,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
});

describe(getYieldOpportunityData.name, () => {
    describe('wrapped-native (WETH) vault', () => {
        it('combines the token balance with the full native balance', () => {
            const account = mockWalletAccount({
                symbol: 'eth',
                formattedBalance: '1',
                tokens: [
                    mockAccountToken({
                        contract: WETH_ADDRESS,
                        symbol: 'WETH',
                        decimals: 18,
                        balance: '0.5',
                    }),
                ],
            });

            const data = getYieldOpportunityData({
                account,
                networkSymbol: 'eth',
                vault: wethVault,
            });

            expect(data.additionalDepositAmount).toBe('1.5');
        });

        it('counts a native-only account (no WETH token) as depositable', () => {
            const account = mockWalletAccount({ symbol: 'eth', formattedBalance: '1' });

            const data = getYieldOpportunityData({
                account,
                networkSymbol: 'eth',
                vault: wethVault,
            });

            expect(data.matchedInputToken).toBeUndefined();
            expect(data.additionalDepositAmount).toBe('1');
            expect(data.hasRewardsData).toBe(true);
        });

        it('counts a small native balance as fully depositable (no gas reserve deducted)', () => {
            const account = mockWalletAccount({ symbol: 'eth', formattedBalance: '0.003' });

            const data = getYieldOpportunityData({
                account,
                networkSymbol: 'eth',
                vault: wethVault,
            });

            expect(data.additionalDepositAmount).toBe('0.003');
            expect(data.hasRewardsData).toBe(true);
        });

        it('denominates amounts in the native symbol without a token contract', () => {
            const account = mockWalletAccount({
                symbol: 'eth',
                formattedBalance: '1',
                tokens: [
                    mockAccountToken({
                        contract: WETH_ADDRESS,
                        symbol: 'WETH',
                        decimals: 18,
                        balance: '0.5',
                    }),
                ],
            });

            const data = getYieldOpportunityData({
                account,
                networkSymbol: 'eth',
                vault: wethVault,
            });

            expect(data.depositedSymbol).toBe('ETH');
            expect(data.depositedContractAddress).toBeNull();
        });
    });

    describe('non-wrapped-native vault', () => {
        it('uses only the matched token balance and keeps the token denomination', () => {
            const account = mockWalletAccount({
                symbol: 'eth',
                formattedBalance: '1',
                tokens: [
                    mockAccountToken({
                        contract: USDC_ADDRESS,
                        symbol: 'USDC',
                        decimals: 6,
                        balance: '100',
                    }),
                ],
            });

            const data = getYieldOpportunityData({
                account,
                networkSymbol: 'eth',
                vault: usdcVault,
            });

            expect(data.additionalDepositAmount).toBe('100');
            expect(data.depositedSymbol).toBe('USDC');
            expect(data.depositedContractAddress).toBe(USDC_ADDRESS);
        });

        it('is not depositable without the matched token, regardless of native balance', () => {
            const account = mockWalletAccount({ symbol: 'eth', formattedBalance: '5' });

            const data = getYieldOpportunityData({
                account,
                networkSymbol: 'eth',
                vault: usdcVault,
            });

            expect(data.additionalDepositAmount).toBe('0');
            expect(data.hasRewardsData).toBe(false);
        });
    });
});

describe(useYieldTableData.name, () => {
    it('classifies a native-only account as depositable, ahead of empty accounts', () => {
        const emptyAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('0xbe1030e5e50e5e0'),
            formattedBalance: '0',
        });
        const nativeOnlyAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('0xde9051ab1e0e0e0'),
            formattedBalance: '1',
        });

        const { result } = renderHook(() =>
            useYieldTableData({
                availableVaults: [wethVault],
                visibleAccounts: [emptyAccount, nativeOnlyAccount],
                visibleAccountSymbols: new Set<NetworkSymbol>(['eth']),
            }),
        );

        const opportunities = result.current.yieldAccountOpportunities;

        // The depositable bucket is ordered before the no-balance bucket.
        expect(
            opportunities.map(({ account, additionalDepositAmount }) => ({
                key: account?.key,
                additionalDepositAmount,
            })),
        ).toEqual([
            { key: nativeOnlyAccount.key, additionalDepositAmount: '1' },
            { key: emptyAccount.key, additionalDepositAmount: '0' },
        ]);
    });
});
