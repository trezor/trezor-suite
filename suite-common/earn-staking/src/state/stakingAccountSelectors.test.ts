import {
    type StakingPosition,
    type StakingPositionBalances,
    type StakingProductDescriptor,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import {
    type WalletSettingsState,
    fiatRatesInitialState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type CurrentRate,
    type CurrentRatesByKey,
    asTimestamp,
} from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingAccountFiatRootState,
    selectAccountCryptoBalanceWithStaking,
    selectCountedStakingPositionEntriesByAccount,
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingOperationPending,
    selectStakingAccountAmount,
    selectStakingAccountFiatAmount,
    selectStakingAccountLockup,
    selectStakingAccountNotice,
    selectStakingAccountPositionDetails,
    selectStakingAccountPositionEntry,
    selectStakingPositionEntriesByAccount,
} from './stakingAccountSelectors';
import { mockStakingState } from '../../mocks';

const amount = (value: string) => stakingAmountSchema.parse(value);

const balances = (overrides: Partial<StakingPositionBalances>): StakingPositionBalances => ({
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
    ...overrides,
});

const eth = mockStakingProductDescriptor();
const thod = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('thod') });
const sol = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('sol'), type: 'native' });
const solExternal = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('sol'),
    providerId: stakingProviderIdSchema.parse('external'),
    type: 'native',
    operations: [],
    consentKey: null,
    isCountedInAccountTotals: false,
});
const ada = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('ada'),
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
});
const trx = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('trx'),
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
});

const DESCRIPTORS = [eth, thod, sol, solExternal, ada, trx];

const ethAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    availableBalance: '1500000000000000000',
});
const thodAccount = mockWalletAccount({
    symbol: asNetworkSymbol('thod'),
    availableBalance: '1500000000000000000',
});
const solAccount = mockWalletAccount({
    symbol: asNetworkSymbol('sol'),
    availableBalance: '2500000000',
});
const adaAccount = mockWalletAccount({
    symbol: asNetworkSymbol('ada'),
    availableBalance: '1000000000',
});
const trxAccount = mockWalletAccount({
    symbol: asNetworkSymbol('trx'),
    availableBalance: '500000000',
});

const ACCOUNTS = [ethAccount, thodAccount, solAccount, adaAccount, trxAccount];

// 2 ETH staked and 0.5 ETH unstaking: 2.5 ETH outside the balance.
const ethPosition = mockStakingPosition();
const thodPosition = mockStakingPosition({ productId: thod.id });
const solPosition = mockStakingPosition({
    productId: sol.id,
    balances: balances({ staked: amount('5000000000'), rewards: amount('854795') }),
    unlocks: [],
});
const solExternalPosition = mockStakingPosition({
    productId: solExternal.id,
    balances: balances({ staked: amount('10000000000') }),
    unlocks: [],
    operations: [],
});
const adaPosition = mockStakingPosition({
    productId: ada.id,
    lockup: 'liquid',
    balances: balances({ staked: amount('994750000'), rewards: amount('5250000') }),
    unlocks: [],
    operations: ['unstake', 'claim', 'vote'],
});
const trxPosition = mockStakingPosition({
    productId: trx.id,
    balances: balances({
        staked: amount('1000000000'),
        unstaking: amount('200000000'),
        withdrawable: amount('300000000'),
        rewards: amount('1500000'),
    }),
    unlocks: [{ amount: amount('200000000'), availableAt: 1_800_000_000_000 }],
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
});

const POSITIONS: Partial<Record<AccountKey, readonly StakingPosition[]>> = {
    [ethAccount.key]: [ethPosition],
    [thodAccount.key]: [thodPosition],
    [solAccount.key]: [solPosition, solExternalPosition],
    [adaAccount.key]: [adaPosition],
    [trxAccount.key]: [trxPosition],
};

const createRate = (symbol: NetworkSymbol, rate: number): CurrentRate => ({
    rate,
    usdRate: rate,
    lastTickerTimestamp: asTimestamp(0),
    lastSuccessfulFetchTimestamp: asTimestamp(0),
    isLoading: false,
    error: null,
    ticker: { symbol },
});

type CreateStateParams = {
    descriptors?: readonly StakingProductDescriptor[];
    positions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
    accounts?: Account[];
    rates?: CurrentRatesByKey;
    localCurrency?: WalletSettingsState['localCurrency'];
};

const createState = ({
    descriptors = DESCRIPTORS,
    positions = POSITIONS,
    accounts = ACCOUNTS,
    rates = {},
    localCurrency = 'usd',
}: CreateStateParams = {}): StakingAccountFiatRootState => ({
    earn: { staking: mockStakingState({ descriptors, positions }) },
    wallet: {
        accounts,
        fiat: { ...fiatRatesInitialState, current: rates },
        settings: { ...initialWalletSettingsState, localCurrency },
    },
});

const unknownAccountKey = mockAccountKey({ descriptor: 'unknown', symbol: asNetworkSymbol('eth') });

describe('selectStakingPositionEntriesByAccount', () => {
    it('pairs every position with its descriptor and the account key', () => {
        expect(selectStakingPositionEntriesByAccount(createState(), solAccount.key)).toEqual([
            { accountKey: solAccount.key, position: solPosition, descriptor: sol },
            { accountKey: solAccount.key, position: solExternalPosition, descriptor: solExternal },
        ]);
    });

    it('lists the entries in the registration order of their products', () => {
        const state = createState({
            descriptors: [solExternal, sol],
            positions: { [solAccount.key]: [solPosition, solExternalPosition] },
        });

        expect(
            selectStakingPositionEntriesByAccount(state, solAccount.key).map(
                ({ descriptor }) => descriptor.id,
            ),
        ).toEqual([solExternal.id, sol.id]);
    });

    it('leaves out a position whose product is not registered', () => {
        const state = createState({ descriptors: [sol] });

        expect(
            selectStakingPositionEntriesByAccount(state, solAccount.key).map(
                ({ descriptor }) => descriptor.id,
            ),
        ).toEqual([sol.id]);
    });

    it('shares one empty list between accounts without positions', () => {
        const state = createState();

        expect(selectStakingPositionEntriesByAccount(state, unknownAccountKey)).toEqual([]);
        expect(selectStakingPositionEntriesByAccount(state, unknownAccountKey)).toBe(
            selectStakingPositionEntriesByAccount(createState({ positions: {} }), ethAccount.key),
        );
    });

    it('keeps the references across a recreated state and interleaved accounts', () => {
        const first = createState();
        const second = createState();
        const ethEntries = selectStakingPositionEntriesByAccount(first, ethAccount.key);

        selectStakingPositionEntriesByAccount(first, solAccount.key);
        selectStakingPositionEntriesByAccount(second, solAccount.key);

        expect(selectStakingPositionEntriesByAccount(second, ethAccount.key)).toBe(ethEntries);
        expect(selectStakingPositionEntriesByAccount(second, solAccount.key)).toBe(
            selectStakingPositionEntriesByAccount(first, solAccount.key),
        );
        expect(selectStakingPositionEntriesByAccount(second, ethAccount.key)[0]).toBe(
            ethEntries[0],
        );
    });
});

describe('selectCountedStakingPositionEntriesByAccount', () => {
    it('leaves out the products that do not count in account totals', () => {
        const state = createState();

        expect(
            selectCountedStakingPositionEntriesByAccount(state, solAccount.key).map(
                ({ descriptor }) => descriptor.id,
            ),
        ).toEqual([sol.id]);
        expect(selectCountedStakingPositionEntriesByAccount(state, ethAccount.key)).toBe(
            selectStakingPositionEntriesByAccount(state, ethAccount.key),
        );
    });

    it('shares the empty list when only uncounted positions exist', () => {
        const state = createState({ positions: { [solAccount.key]: [solExternalPosition] } });

        expect(selectCountedStakingPositionEntriesByAccount(state, solAccount.key)).toBe(
            selectCountedStakingPositionEntriesByAccount(state, unknownAccountKey),
        );
    });

    it('keeps the reference across a recreated state', () => {
        expect(selectCountedStakingPositionEntriesByAccount(createState(), solAccount.key)).toBe(
            selectCountedStakingPositionEntriesByAccount(createState(), solAccount.key),
        );
    });
});

describe('selectStakingAccountPositionEntry', () => {
    it('is the counted entry of the account', () => {
        expect(selectStakingAccountPositionEntry(createState(), solAccount.key)).toEqual({
            accountKey: solAccount.key,
            position: solPosition,
            descriptor: sol,
        });
    });

    it('is null without a counted position', () => {
        expect(selectStakingAccountPositionEntry(createState(), unknownAccountKey)).toBeNull();
        expect(
            selectStakingAccountPositionEntry(
                createState({ positions: { [solAccount.key]: [solExternalPosition] } }),
                solAccount.key,
            ),
        ).toBeNull();
    });

    it('keeps the reference while the state is unchanged', () => {
        const state = createState();

        expect(selectStakingAccountPositionEntry(state, ethAccount.key)).toBe(
            selectStakingAccountPositionEntry(state, ethAccount.key),
        );
    });
});

describe('selectStakingAccountNotice', () => {
    const externalProduct = mockStakingProductDescriptor({
        networkSymbol: asNetworkSymbol('ada'),
        providerId: stakingProviderIdSchema.parse('external'),
        type: 'native',
        operations: ['unstake', 'claim', 'vote'],
    });

    const selectCardanoNotice = (position: StakingPosition) =>
        selectStakingAccountNotice(
            createState({
                descriptors: [externalProduct],
                positions: { [adaAccount.key]: [position] },
            }),
            adaAccount.key,
        );

    it('distinguishes an external pool from a retired provider', () => {
        const externalPosition = { ...adaPosition, productId: externalProduct.id };

        expect(selectCardanoNotice(externalPosition)).toEqual({ kind: 'external-provider' });
        expect(
            selectCardanoNotice({
                ...externalPosition,
                warnings: [{ code: 'outdated-provider', providerId: externalProduct.providerId }],
            }),
        ).toEqual({ kind: 'outdated-provider' });
    });

    it('shows a missing pool until a delegation is pending', () => {
        const noPoolPosition = mockStakingPosition({
            productId: externalProduct.id,
            targets: [],
            warnings: [{ code: 'no-stake-pool' }],
        });

        expect(selectCardanoNotice(noPoolPosition)).toEqual({ kind: 'no-stake-pool' });
        expect(
            selectCardanoNotice({
                ...noPoolPosition,
                pendingTransactions: [{ txid: 'delegation', operation: 'stake' }],
            }),
        ).toBeNull();
    });

    it.each([
        { votingPower: '2000000', expected: { kind: 'votes-left', count: '2' } },
        { votingPower: '0', expected: null },
    ])('reports remaining TRON votes for $votingPower sun', ({ votingPower, expected }) => {
        const position = mockStakingPosition({
            productId: trx.id,
            details: {
                kind: 'tron-staking',
                frozen: { energy: amount('0'), bandwidth: amount('0') },
                delegated: { energy: amount('0'), bandwidth: amount('0') },
                votingPower: amount('5000000'),
                unallocatedVotingPower: amount(votingPower),
                rewardClaimAvailableAt: null,
            },
        });
        const state = createState({ positions: { [trxAccount.key]: [position] } });

        expect(selectStakingAccountNotice(state, trxAccount.key)).toEqual(expected);
    });

    it('is null without a position', () => {
        expect(selectStakingAccountNotice(createState(), unknownAccountKey)).toBeNull();
    });
});

describe('selectStakingAccountPositionDetails', () => {
    const tronDetails = {
        kind: 'tron-staking' as const,
        frozen: { energy: amount('0'), bandwidth: amount('0') },
        delegated: { energy: amount('0'), bandwidth: amount('0') },
        votingPower: amount('5000000'),
        unallocatedVotingPower: amount('2000000'),
        rewardClaimAvailableAt: null,
    };
    const state = createState({
        positions: { ...POSITIONS, [trxAccount.key]: [{ ...trxPosition, details: tronDetails }] },
    });

    it('is the details of the account position when they are of the kind', () => {
        expect(selectStakingAccountPositionDetails(state, trxAccount.key, 'tron-staking')).toBe(
            tronDetails,
        );
    });

    it('is null for details of another kind or without a position', () => {
        expect(
            selectStakingAccountPositionDetails(state, trxAccount.key, 'cardano-delegation'),
        ).toBeNull();
        expect(
            selectStakingAccountPositionDetails(state, ethAccount.key, 'tron-staking'),
        ).toBeNull();
        expect(
            selectStakingAccountPositionDetails(state, unknownAccountKey, 'tron-staking'),
        ).toBeNull();
    });
});

describe('selectIsStakingAccountActive', () => {
    it.each([
        { name: 'an active Ethereum pool', account: ethAccount, expected: true },
        { name: 'a Hoodi pool', account: thodAccount, expected: true },
        { name: 'a delegated Cardano stake key', account: adaAccount, expected: true },
        { name: 'frozen TRX', account: trxAccount, expected: true },
        {
            name: 'no position',
            account: mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
            expected: false,
        },
    ])('is $expected for $name', ({ account, expected }) => {
        expect(selectIsStakingAccountActive(createState(), account.key)).toBe(expected);
    });

    it('is false for a pool entry at zero that only offers stake', () => {
        const state = createState({
            positions: {
                [ethAccount.key]: [
                    mockStakingPosition({
                        status: 'inactive',
                        balances: balances({}),
                        unlocks: [],
                        targets: [],
                        operations: ['stake'],
                    }),
                ],
            },
        });

        expect(selectIsStakingAccountActive(state, ethAccount.key)).toBe(false);
    });

    it('is true for a registered Cardano stake key with an empty balance', () => {
        const state = createState({
            positions: {
                [adaAccount.key]: [
                    mockStakingPosition({
                        productId: ada.id,
                        status: 'inactive',
                        lockup: 'liquid',
                        balances: balances({}),
                        unlocks: [],
                        targets: [],
                        operations: ['unstake', 'vote'],
                    }),
                ],
            },
        });

        expect(selectIsStakingAccountActive(state, adaAccount.key)).toBe(true);
    });

    it('is true for TRX with only unclaimed rewards', () => {
        const state = createState({
            positions: {
                [trxAccount.key]: [
                    mockStakingPosition({
                        productId: trx.id,
                        status: 'inactive',
                        balances: balances({ rewards: amount('1500000') }),
                        unlocks: [],
                        targets: [],
                        operations: ['stake', 'claim'],
                    }),
                ],
            },
        });

        expect(selectIsStakingAccountActive(state, trxAccount.key)).toBe(true);
    });

    it('ignores stake with other Solana validators', () => {
        const state = createState({ positions: { [solAccount.key]: [solExternalPosition] } });

        expect(selectIsStakingAccountActive(state, solAccount.key)).toBe(false);
    });
});

describe('selectIsStakingOperationPending', () => {
    const pendingStake = mockStakingPosition({
        pendingTransactions: [{ txid: '0xstake', operation: 'stake' }],
    });

    it('answers for the given operation on the counted positions', () => {
        const state = createState({ positions: { [ethAccount.key]: [pendingStake] } });

        expect(selectIsStakingOperationPending(state, ethAccount.key, 'stake')).toBe(true);
        expect(selectIsStakingOperationPending(state, ethAccount.key, 'unstake')).toBe(false);
        expect(selectIsStakingOperationPending(createState(), ethAccount.key, 'stake')).toBe(false);
    });

    it('ignores a pending transaction of an uncounted position', () => {
        const state = createState({
            positions: {
                [solAccount.key]: [
                    {
                        ...solExternalPosition,
                        pendingTransactions: [{ txid: 'x', operation: 'stake' }],
                    },
                ],
            },
        });

        expect(selectIsStakingOperationPending(state, solAccount.key, 'stake')).toBe(false);
    });

    it('answers for any operation when none is given', () => {
        const state = createState({ positions: { [ethAccount.key]: [pendingStake] } });

        expect(selectIsStakingOperationPending(state, ethAccount.key)).toBe(true);
        expect(selectIsStakingOperationPending(createState(), ethAccount.key)).toBe(false);
    });
});

describe('selectStakingAccountLockup', () => {
    it('reads the lockup of the counted position', () => {
        const liquid = mockStakingPosition({ lockup: 'liquid' });

        expect(selectStakingAccountLockup(createState(), ethAccount.key)).toBe('locked');
        expect(
            selectStakingAccountLockup(
                createState({ positions: { [ethAccount.key]: [liquid] } }),
                ethAccount.key,
            ),
        ).toBe('liquid');
    });

    it('is null without a counted position', () => {
        expect(
            selectStakingAccountLockup(createState({ positions: {} }), ethAccount.key),
        ).toBeNull();
    });
});

describe('selectStakingAccountAmount', () => {
    it.each([
        {
            name: 'sums the locked Ethereum buckets',
            account: ethAccount,
            expected: '2500000000000000000',
        },
        {
            name: 'counts the Everstake Solana stake only',
            account: solAccount,
            expected: '5000000000',
        },
        { name: 'takes the delegated Cardano balance', account: adaAccount, expected: '994750000' },
        {
            name: 'adds frozen TRX, the queue and the withdrawable amount',
            account: trxAccount,
            expected: '1500000000',
        },
    ])('$name', ({ account, expected }) => {
        expect(selectStakingAccountAmount(createState(), account.key)).toBe(expected);
    });

    it('is zero without a position', () => {
        expect(selectStakingAccountAmount(createState(), unknownAccountKey)).toBe('0');
    });
});

describe('selectHasStakingAccountWarning', () => {
    const outdatedProvider = {
        code: 'outdated-provider' as const,
        providerId: stakingProviderIdSchema.parse('fivebinaries'),
    };

    it('finds the warning on a position of the account', () => {
        const state = createState({
            positions: {
                [adaAccount.key]: [{ ...adaPosition, warnings: [outdatedProvider] }],
            },
        });

        expect(selectHasStakingAccountWarning(state, adaAccount.key, 'outdated-provider')).toBe(
            true,
        );
        expect(selectHasStakingAccountWarning(state, adaAccount.key, 'missing-drep')).toBe(false);
    });

    it('is false without the warning', () => {
        expect(
            selectHasStakingAccountWarning(createState(), adaAccount.key, 'outdated-provider'),
        ).toBe(false);
    });

    it('ignores an uncounted position, as the other account readings do', () => {
        const state = createState({
            positions: {
                [solAccount.key]: [
                    { ...solExternalPosition, warnings: [{ code: 'missing-drep' }] },
                ],
            },
        });

        expect(selectHasStakingAccountWarning(state, solAccount.key, 'missing-drep')).toBe(false);
    });
});

describe('selectStakingAccountFiatAmount', () => {
    const usdRates: CurrentRatesByKey = {
        [getFiatRateKey(asNetworkSymbol('eth'), 'usd')]: createRate(asNetworkSymbol('eth'), 2000),
        [getFiatRateKey(asNetworkSymbol('ada'), 'usd')]: createRate(asNetworkSymbol('ada'), 0.5),
    };

    it('values the amount outside the balance at the native token rate', () => {
        const state = createState({ rates: usdRates });

        expect(selectStakingAccountFiatAmount(state, ethAccount.key)?.toFixed()).toBe('5000');
        expect(selectStakingAccountFiatAmount(state, adaAccount.key)?.toFixed()).toBe('2.625');
    });

    it.each([
        { name: 'without a rate', account: solAccount },
        { name: 'on a testnet', account: thodAccount },
        { name: 'without the account', account: { key: unknownAccountKey } },
    ])('is unknown $name', ({ account }) => {
        expect(
            selectStakingAccountFiatAmount(createState({ rates: usdRates }), account.key),
        ).toBeNull();
    });

    it('follows the base currency', () => {
        const state = createState({
            rates: {
                ...usdRates,
                [getFiatRateKey(asNetworkSymbol('eth'), 'eur')]: createRate(
                    asNetworkSymbol('eth'),
                    1800,
                ),
            },
            localCurrency: 'eur',
        });

        expect(selectStakingAccountFiatAmount(state, ethAccount.key)?.toFixed()).toBe('4500');
    });

    it('keeps the reference across a recreated state', () => {
        expect(
            selectStakingAccountFiatAmount(createState({ rates: usdRates }), ethAccount.key),
        ).toBe(selectStakingAccountFiatAmount(createState({ rates: usdRates }), ethAccount.key));
    });
});

describe('selectAccountCryptoBalanceWithStaking', () => {
    const stakingAccount = { ...ethAccount, formattedBalance: '1.5' };
    // The 1.2 XRP reserve sits in the formatted balance and outside the available one.
    const rippleAccount = mockWalletAccount({
        symbol: asNetworkSymbol('xrp'),
        balance: '3110000',
        availableBalance: '1910000',
        formattedBalance: '3.11',
    });
    const state = createState({ accounts: [stakingAccount, rippleAccount] });

    it('adds the amount outside the balance to the formatted balance', () => {
        // 1.5 ETH held, 2 ETH staked and 0.5 ETH unstaking.
        expect(selectAccountCryptoBalanceWithStaking(state, stakingAccount.key)).toBe('4');
    });

    it('keeps the reserve of a Ripple account without a position', () => {
        expect(selectAccountCryptoBalanceWithStaking(state, rippleAccount.key)).toBe('3.11');
    });

    it('is zero without the account', () => {
        expect(selectAccountCryptoBalanceWithStaking(state, unknownAccountKey)).toBe('0');
    });
});
