import { useSelector } from 'react-redux';

import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { type StablecoinYieldEarnItem, type StakingEarnItem } from '../../types';
import { useEarnDepositsCardData } from '../useEarnDepositsCardData';

jest.mock('react-redux', () => ({
    useSelector: jest.fn(),
}));

jest.mock('@suite-native/intl', () => ({
    ...jest.requireActual('@suite-native/intl'),
    useTranslate: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockUseTranslate = jest.mocked(useTranslate);

const testContractAddress = 'test-contract-address' as TokenAddress;
const testTokenSymbol = 'USDC' as TokenSymbol;

const stakingActiveItem: StakingEarnItem = {
    id: 'eth-1',
    type: 'staking',
    symbol: 'eth',
    accountKey: 'eth-account' as AccountKey,
    accountLabel: 'Ethereum #1',
    balance: '1',
};

const secondStakingActiveItem: StakingEarnItem = {
    id: 'eth-2',
    type: 'staking',
    symbol: 'eth',
    accountKey: 'eth-account-2' as AccountKey,
    accountLabel: 'Ethereum #2',
    balance: '0.2',
};

const solStakingActiveItem: StakingEarnItem = {
    id: 'sol-1',
    type: 'staking',
    symbol: 'sol',
    accountKey: 'sol-account' as AccountKey,
    accountLabel: 'Solana #1',
    balance: '2',
};

const invalidStakingActiveItem: StakingEarnItem = {
    id: 'invalid-eth-1',
    type: 'staking',
    symbol: 'eth',
    accountKey: null,
    accountLabel: 'Ethereum invalid',
    balance: '1',
};

const stablecoinYieldActiveItem: StablecoinYieldEarnItem = {
    id: 'steakhouse-usdc',
    type: 'stablecoin-yield',
    vaultName: 'Steakhouse USDC',
    tokenSymbol: testTokenSymbol,
    networkSymbol: 'eth',
    contractAddress: testContractAddress,
    accountKey: 'usdc-account' as AccountKey,
    accountLabel: 'Ethereum #3',
    tokenBalance: '400',
    apy: 4,
};

const secondStablecoinYieldActiveItem: StablecoinYieldEarnItem = {
    id: 'moonwell-usdc',
    type: 'stablecoin-yield',
    vaultName: 'Moonwell USDC',
    tokenSymbol: testTokenSymbol,
    networkSymbol: 'base',
    contractAddress: testContractAddress,
    accountKey: 'usdc-account-2' as AccountKey,
    accountLabel: 'Base Ethereum #1',
    tokenBalance: '600',
    apy: 3,
};

const invalidStablecoinYieldActiveItem: StablecoinYieldEarnItem = {
    id: 'invalid-steakhouse-usdc',
    type: 'stablecoin-yield',
    vaultName: 'Invalid Steakhouse USDC',
    tokenSymbol: testTokenSymbol,
    networkSymbol: 'eth',
    contractAddress: testContractAddress,
    accountKey: null,
    accountLabel: 'Ethereum invalid',
    tokenBalance: '400',
    apy: 4,
};

describe('useEarnDepositsCardData', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseSelector.mockImplementation(selector => {
            if (selector === selectCurrentFiatRates) {
                return {
                    'eth-usd': { rate: 2000 },
                    'sol-usd': { rate: 100 },
                };
            }

            if (selector === selectBaseCurrency) {
                return 'usd';
            }

            throw new Error(`Unexpected selector: ${selector.name}`);
        });

        mockUseTranslate.mockReturnValue({
            translate: (id, values) => {
                switch (id) {
                    case 'earn.staking':
                        return 'Staking';
                    case 'earn.stablecoinYield':
                        return 'Stablecoin yield';
                    case 'earn.earnScreen.depositsCard.networkStaking':
                        return `${values?.networkName} staking`;
                    default:
                        return id;
                }
            },
        } as ReturnType<typeof useTranslate>);
    });

    it('returns specific titles and a combined total for single active positions', () => {
        const { result } = renderHookWithBasicProvider(() =>
            useEarnDepositsCardData({
                stakingActiveItems: [stakingActiveItem],
                stablecoinYieldActiveItems: [stablecoinYieldActiveItem],
            }),
        );

        expect(result.current.shouldShowCard).toBe(true);
        expect(result.current.totalDepositedFiatAmount.toString()).toBe('2000');
        expect(result.current.stakingRow).toMatchObject({
            type: 'staking',
            title: 'Ethereum staking',
        });
        expect(result.current.stakingRow?.activeItems[0]).toMatchObject({
            type: 'staking',
            title: 'Ethereum #1',
            symbol: 'eth',
            accountKey: 'eth-account',
            balance: '1',
        });
        expect(result.current.stakingRow?.activeItems[0]?.fiatAmount.toString()).toBe('2000');

        expect(result.current.stablecoinYieldRow).toMatchObject({
            type: 'stablecoin-yield',
            title: 'Steakhouse USDC',
        });
        expect(result.current.stablecoinYieldRow?.activeItems[0]).toMatchObject({
            type: 'stablecoin-yield',
            title: 'Steakhouse USDC',
            networkSymbol: 'eth',
            tokenSymbol: 'USDC',
            contractAddress: testContractAddress,
            accountKey: 'usdc-account',
            accountLabel: 'Ethereum #3',
            balance: '400',
            apy: 4,
        });
        expect(result.current.stablecoinYieldRow?.activeItems[0]?.fiatAmount.toString()).toBe('0');
    });

    it('uses generic titles when there are multiple active positions of the same type', () => {
        const { result } = renderHookWithBasicProvider(() =>
            useEarnDepositsCardData({
                stakingActiveItems: [stakingActiveItem, secondStakingActiveItem],
                stablecoinYieldActiveItems: [
                    stablecoinYieldActiveItem,
                    secondStablecoinYieldActiveItem,
                ],
            }),
        );

        expect(result.current.totalDepositedFiatAmount.toString()).toBe('2400');
        expect(result.current.stakingRow).toMatchObject({
            type: 'staking',
            title: 'Ethereum staking',
        });
        expect(result.current.stakingRow?.activeItems).toHaveLength(2);

        expect(result.current.stablecoinYieldRow).toMatchObject({
            type: 'stablecoin-yield',
            title: 'Stablecoin yield',
        });
        expect(result.current.stablecoinYieldRow?.activeItems).toHaveLength(2);
    });

    it('uses generic staking title when active staking positions have different symbols', () => {
        const { result } = renderHookWithBasicProvider(() =>
            useEarnDepositsCardData({
                stakingActiveItems: [stakingActiveItem, solStakingActiveItem],
                stablecoinYieldActiveItems: [],
            }),
        );

        expect(result.current.shouldShowCard).toBe(true);
        expect(result.current.totalDepositedFiatAmount.toString()).toBe('2200');
        expect(result.current.stakingRow).toMatchObject({
            type: 'staking',
            title: 'Staking',
        });
        expect(result.current.stakingRow?.activeItems).toHaveLength(2);
        expect(result.current.stablecoinYieldRow).toBeNull();
    });

    it('filters out invalid active items before building rows', () => {
        const { result } = renderHookWithBasicProvider(() =>
            useEarnDepositsCardData({
                stakingActiveItems: [stakingActiveItem, invalidStakingActiveItem],
                stablecoinYieldActiveItems: [
                    stablecoinYieldActiveItem,
                    invalidStablecoinYieldActiveItem,
                ],
            }),
        );

        expect(result.current.shouldShowCard).toBe(true);
        expect(result.current.totalDepositedFiatAmount.toString()).toBe('2000');
        expect(result.current.stakingRow?.activeItems).toHaveLength(1);
        expect(result.current.stakingRow?.activeItems[0]?.id).toBe('eth-1');
        expect(result.current.stablecoinYieldRow?.activeItems).toHaveLength(1);
        expect(result.current.stablecoinYieldRow?.activeItems[0]?.id).toBe('steakhouse-usdc');
    });

    it('hides the card when there are no active positions', () => {
        const { result } = renderHookWithBasicProvider(() =>
            useEarnDepositsCardData({
                stakingActiveItems: [],
                stablecoinYieldActiveItems: [],
            }),
        );

        expect(result.current.shouldShowCard).toBe(false);
        expect(result.current.stakingRow).toBeNull();
        expect(result.current.stablecoinYieldRow).toBeNull();
        expect(result.current.totalDepositedFiatAmount.toString()).toBe('0');
    });
});
