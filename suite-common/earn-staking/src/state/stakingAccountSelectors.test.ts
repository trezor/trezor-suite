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
    selectCountedStakingPositionEntriesByAccount,
    selectIsStakingAccountActive,
    selectIsStakingOperationPending,
    selectStakingAccountBalanceWithStaking,
    selectStakingAccountFiatAmount,
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
    rewardsKind: 'claimable',
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
});

describe('selectStakingAccountBalanceWithStaking', () => {
    it.each([
        {
            name: 'adds the locked Ethereum stake',
            account: ethAccount,
            expected: '4000000000000000000',
        },
        { name: 'adds the counted Solana stake only', account: solAccount, expected: '7500000000' },
        { name: 'keeps the liquid Cardano balance', account: adaAccount, expected: '1000000000' },
        {
            name: 'adds frozen TRX and the unfreeze queue',
            account: trxAccount,
            expected: '2000000000',
        },
    ])('$name', ({ account, expected }) => {
        expect(selectStakingAccountBalanceWithStaking(createState(), account.key)).toBe(expected);
    });

    it('is zero without the account', () => {
        expect(selectStakingAccountBalanceWithStaking(createState(), unknownAccountKey)).toBe('0');
    });

    it('is the available balance without a position', () => {
        const state = createState({ positions: {} });

        expect(selectStakingAccountBalanceWithStaking(state, ethAccount.key)).toBe(
            '1500000000000000000',
        );
    });
});

describe('selectStakingAccountFiatAmount', () => {
    const usdRates: CurrentRatesByKey = {
        [getFiatRateKey(asNetworkSymbol('eth'), 'usd')]: createRate(asNetworkSymbol('eth'), 2000),
        [getFiatRateKey(asNetworkSymbol('ada'), 'usd')]: createRate(asNetworkSymbol('ada'), 0.5),
    };

    it('values the amount outside the balance at the coin rate', () => {
        const state = createState({ rates: usdRates });

        expect(selectStakingAccountFiatAmount(state, ethAccount.key)?.toFixed()).toBe('5000');
        expect(selectStakingAccountFiatAmount(state, adaAccount.key)?.toFixed()).toBe('0');
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
