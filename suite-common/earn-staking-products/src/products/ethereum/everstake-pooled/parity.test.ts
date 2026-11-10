import type { EthOrSolStats, EthValidatorsQueue } from '@suite-common/earn-staking-api';
import {
    type StakingAccount,
    type StakingPosition,
    type StakingProductAdapter,
    type StakingProductInfo,
    type StakingTransaction,
    assertStakingPosition,
} from '@suite-common/earn-staking-common';
import { mockStakingTransaction } from '@suite-common/earn-staking-common/mocks';
import {
    type EthereumStakingScenario,
    MOCK_STAKING_NOW_SECONDS,
    mockEthereumStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { BigNumber } from '@trezor/utils';

import {
    type EthereumEverstakePooledProductDeps,
    createEthereumEverstakePooledProduct,
} from './product';

// The oracle is the P0.1 characterization suite in wallet-core
// (src/staking/stakingSelectors.characterization.test.ts and the ethereum details suite next to
// it), whose literals are copied here. Products cannot import the legacy selectors, so this file
// derives the same readings from the position and the product info the way P2.5 will, in ether.
const SECONDS_IN_DAY = 24 * 60 * 60;

const stats: EthOrSolStats = { symbol: 'eth', apy: 3.08, nextRewardPayout: 5 * SECONDS_IN_DAY };

const validatorsQueue: EthValidatorsQueue = {
    activationTime: 3 * SECONDS_IN_DAY,
    exitTime: 2 * SECONDS_IN_DAY,
    withdrawTime: SECONDS_IN_DAY,
    addingDelay: SECONDS_IN_DAY,
    updatedAt: MOCK_STAKING_NOW_SECONDS,
};

const createProduct = (symbol: string): StakingProductAdapter =>
    createEthereumEverstakePooledProduct({
        networkSymbol: asNetworkSymbol(symbol),
        ...createMockDeps<EthereumEverstakePooledProductDeps>({
            getStakingStats: () => Promise.resolve(stats),
            getEthereumValidatorsQueue: () => Promise.resolve(validatorsQueue),
        }),
    });

const fromWei = (wei: string | BigNumber) => new BigNumber(wei).shiftedBy(-18).toFixed();

const sum = (...amounts: string[]) =>
    amounts.reduce((total, amount) => total.plus(amount), new BigNumber(0));

type LegacyReading = {
    hasStaking: boolean;
    isStakePending: boolean;
    isStakeConfirming: boolean;
    apy: number | null;
    staked: string;
    unstakable: string;
    rewards: string;
    totalStakePending: string;
    claimable: string;
    canClaim: boolean;
    unstaking: string;
    unstakingPeriodInDays: number;
    cryptoBalanceWithStaking: string;
    entryPeriodInDays: number | null;
    nextRewardPayoutDays: number | null;
};

type ToLegacyReadingParams = {
    account: StakingAccount;
    position: StakingPosition | null;
    productInfo: StakingProductInfo;
};

const toLegacyReading = ({
    account,
    position,
    productInfo,
}: ToLegacyReadingParams): LegacyReading => {
    const balances = position?.balances;
    const staked = balances?.staked ?? '0';
    const pending = balances?.pending ?? '0';
    const unstaking = balances?.unstaking ?? '0';
    const withdrawable = balances?.withdrawable ?? '0';
    const rewards = balances?.rewards ?? '0';

    return {
        hasStaking: sum(staked, pending, unstaking, withdrawable, rewards).gt(0),
        isStakePending: new BigNumber(pending).gt(0),
        isStakeConfirming:
            position?.pendingTransactions.some(({ operation }) => operation === 'stake') ?? false,
        apy: productInfo.rate,
        staked: fromWei(new BigNumber(staked).minus(rewards)),
        unstakable: fromWei(staked),
        rewards: fromWei(rewards),
        totalStakePending: fromWei(pending),
        claimable: fromWei(withdrawable),
        canClaim: new BigNumber(withdrawable).gt(0),
        unstaking: fromWei(sum(unstaking, withdrawable)),
        unstakingPeriodInDays: productInfo.exitPeriodDays ?? 3,
        cryptoBalanceWithStaking: fromWei(
            sum(account.balance, staked, pending, unstaking, withdrawable),
        ),
        entryPeriodInDays: productInfo.entryPeriodDays,
        nextRewardPayoutDays:
            productInfo.nextRewardAt === null
                ? null
                : Math.max(
                      1,
                      Math.round((productInfo.nextRewardAt - Date.now()) / (SECONDS_IN_DAY * 1000)),
                  ),
    };
};

const ETHEREUM_EMPTY_READING: LegacyReading = {
    hasStaking: false,
    isStakePending: false,
    isStakeConfirming: false,
    apy: 3.08,
    staked: '0',
    unstakable: '0',
    rewards: '0',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 3,
    cryptoBalanceWithStaking: '1.5',
    entryPeriodInDays: 4,
    nextRewardPayoutDays: 5,
};

const ETHEREUM_ACTIVE_READING: LegacyReading = {
    ...ETHEREUM_EMPTY_READING,
    hasStaking: true,
    staked: '2',
    unstakable: '2.05',
    rewards: '0.05',
    cryptoBalanceWithStaking: '3.55',
};

const pendingEverstakeTransaction = (methodId: string, name: string): StakingTransaction =>
    mockStakingTransaction({
        txid: `0x${name}pending`,
        blockHeight: 0,
        ethereumSpecific: {
            status: -1,
            nonce: 6,
            gasLimit: 300_000,
            parsedData: { methodId, name },
        },
    });

const pendingStakeTransaction = () => pendingEverstakeTransaction('0x3a29dbae', 'stake');

describe('everstake pooled product parity with the P0.1 snapshots', () => {
    const eth = createProduct('eth');
    let productInfo: StakingProductInfo;

    const read = (
        account: StakingAccount,
        transactions: readonly StakingTransaction[] = [],
        product = eth,
    ) => {
        const position = product.getPosition({ account, productInfo, transactions });

        if (position !== null) assertStakingPosition(position);

        return toLegacyReading({ account, position, productInfo });
    };

    beforeAll(async () => {
        jest.useFakeTimers().setSystemTime(MOCK_STAKING_NOW_SECONDS * 1000);
        productInfo = await eth.fetchProductInfo({});
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it.each<{ scenario: EthereumStakingScenario; expected: LegacyReading }>([
        { scenario: 'none', expected: ETHEREUM_EMPTY_READING },
        {
            scenario: 'pending',
            expected: {
                ...ETHEREUM_EMPTY_READING,
                hasStaking: true,
                isStakePending: true,
                totalStakePending: '0.75',
                cryptoBalanceWithStaking: '2.25',
            },
        },
        {
            scenario: 'pendingDeposited',
            expected: {
                ...ETHEREUM_EMPTY_READING,
                hasStaking: true,
                isStakePending: true,
                totalStakePending: '0.25',
                cryptoBalanceWithStaking: '1.75',
            },
        },
        { scenario: 'active', expected: ETHEREUM_ACTIVE_READING },
        {
            scenario: 'unstaking',
            expected: {
                ...ETHEREUM_EMPTY_READING,
                hasStaking: true,
                staked: '1',
                unstakable: '1.02',
                rewards: '0.02',
                unstaking: '0.5',
                cryptoBalanceWithStaking: '3.02',
            },
        },
        {
            scenario: 'claimable',
            expected: {
                ...ETHEREUM_EMPTY_READING,
                hasStaking: true,
                staked: '1',
                unstakable: '1.02',
                rewards: '0.02',
                claimable: '0.5',
                canClaim: true,
                unstaking: '0.5',
                cryptoBalanceWithStaking: '3.02',
            },
        },
        { scenario: 'otherPool', expected: ETHEREUM_EMPTY_READING },
    ])('$scenario', ({ scenario, expected }) => {
        expect(read(mockEthereumStakingAccount(scenario))).toEqual(expected);
    });

    // Legacy reports the raw claimable 0.2 of a partly filled request, but every screen shows it
    // only behind canClaim. The position keeps the whole request as unstaking until it is filled.
    it('partiallyClaimable', () => {
        expect(read(mockEthereumStakingAccount('partiallyClaimable'))).toEqual({
            ...ETHEREUM_EMPTY_READING,
            hasStaking: true,
            claimable: '0',
            unstaking: '0.5',
            cryptoBalanceWithStaking: '2',
        });
    });

    it('confirming stake transaction', () => {
        expect(read(mockEthereumStakingAccount('active'), [pendingStakeTransaction()])).toEqual({
            ...ETHEREUM_ACTIVE_READING,
            isStakeConfirming: true,
        });
    });

    it('confirming first stake transaction', () => {
        expect(read(mockEthereumStakingAccount('none'), [pendingStakeTransaction()])).toEqual({
            ...ETHEREUM_EMPTY_READING,
            isStakeConfirming: true,
        });
    });

    it('pending unstake transaction', () => {
        const pendingUnstake = pendingEverstakeTransaction('0x76ec871c', 'unstake');

        expect(read(mockEthereumStakingAccount('active'), [pendingUnstake])).toEqual(
            ETHEREUM_ACTIVE_READING,
        );
    });

    it('pending claim transaction', () => {
        const pendingClaim = pendingEverstakeTransaction('0x33986ffa', 'claim');

        expect(read(mockEthereumStakingAccount('claimable'), [pendingClaim])).toEqual({
            ...ETHEREUM_EMPTY_READING,
            hasStaking: true,
            staked: '1',
            unstakable: '1.02',
            rewards: '0.02',
            claimable: '0.5',
            canClaim: true,
            unstaking: '0.5',
            cryptoBalanceWithStaking: '3.02',
        });
    });

    it('confirmed stake transaction', () => {
        const confirmed = { ...pendingStakeTransaction(), blockHeight: 21_000_000 };

        expect(read(mockEthereumStakingAccount('active'), [confirmed])).toEqual(
            ETHEREUM_ACTIVE_READING,
        );
    });

    // The legacy selectors leave the Hoodi APY null through a missing switch case; the product
    // reads the mainnet stats for both symbols (P2.1 decision 4), so this is the one deliberate
    // difference from the P0.1 snapshot.
    it('Hoodi testnet', () => {
        const account = mockEthereumStakingAccount('active', { symbol: asNetworkSymbol('thod') });

        expect(read(account, [], createProduct('thod'))).toEqual(ETHEREUM_ACTIVE_READING);
    });

    it.each<EthereumStakingScenario>([
        'pending',
        'pendingDeposited',
        'active',
        'unstaking',
        'claimable',
        'partiallyClaimable',
    ])('keeps the deposited balance derivable for the %s pool', scenario => {
        const account = mockEthereumStakingAccount(scenario);
        const position = eth.getPosition({ account, productInfo, transactions: [] });
        const [pool] = account.misc.stakingPools ?? [];

        expect(position).not.toBeNull();
        expect(pool).toBeDefined();
        expect(
            new BigNumber(position?.balances.staked ?? '0')
                .minus(position?.balances.rewards ?? '0')
                .toFixed(),
        ).toBe(pool?.depositedBalance);
    });
});
