import {
    type StakingPosition,
    type StakingPositionBalances,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    type WalletSettingsState,
    fiatRatesInitialState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type CurrentRate,
    type CurrentRatesByKey,
    asAccountDescriptor,
    asTimestamp,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import {
    type NetworkSymbol,
    asNetworkSymbol,
    asNetworkSymbols,
} from '@trezor/network-module-types';

import {
    type StakingFiatRootState,
    selectDeviceStakingFiatPositions,
    selectDeviceStakingFiatValuations,
    selectDeviceStakingTotalFiatAmount,
} from './stakingFiatSelectors';
import { mockStakingState } from '../../mocks';

const DEVICE_STATIC_SESSION_ID = 'selectedWallet@deviceId:0';

const selectedDevice = mockSuiteDevice({
    id: 'selected-device',
    connected: true,
    available: true,
    remember: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

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

const createAccount = (symbol: string, descriptor: string) =>
    mockWalletAccount({
        symbol: asNetworkSymbol(symbol),
        descriptor: asAccountDescriptor(descriptor),
        deviceState: DEVICE_STATIC_SESSION_ID,
    });

const ethAccount = createAccount('eth', 'eth1');
const thodAccount = createAccount('thod', 'thod1');
const solAccount = createAccount('sol', 'sol1');
const adaAccount = createAccount('ada', 'ada1');
const trxAccount = createAccount('trx', 'trx1');

// 2 ETH staked and 0.5 ETH unstaking: 2.5 ETH in the position.
const ethPosition = mockStakingPosition();
const thodPosition = mockStakingPosition({ productId: thod.id });
const solPosition = mockStakingPosition({
    productId: sol.id,
    balances: balances({ staked: amount('5000000000'), rewards: amount('854795') }),
    unlocks: [],
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
    [solAccount.key]: [solPosition],
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

const usdRates: CurrentRatesByKey = {
    [getFiatRateKey(asNetworkSymbol('eth'), 'usd')]: createRate(asNetworkSymbol('eth'), 2000),
    [getFiatRateKey(asNetworkSymbol('ada'), 'usd')]: createRate(asNetworkSymbol('ada'), 0.5),
};

type CreateStateParams = {
    rates?: CurrentRatesByKey;
    localCurrency?: WalletSettingsState['localCurrency'];
};

const createState = ({
    rates = usdRates,
    localCurrency = 'usd',
}: CreateStateParams = {}): StakingFiatRootState => ({
    earn: {
        staking: mockStakingState({
            descriptors: [eth, thod, sol, ada, trx],
            positions: POSITIONS,
        }),
    },
    wallet: {
        accounts: [trxAccount, adaAccount, solAccount, thodAccount, ethAccount],
        fiat: { ...fiatRatesInitialState, current: rates },
        settings: { ...initialWalletSettingsState, localCurrency },
    },
    device: { devices: [selectedDevice], selectedDevice, buttonRequestsByPath: {} },
    networks: mockNetworksState(asNetworkSymbols(['btc', 'eth', 'thod', 'sol', 'ada', 'trx'])),
});

describe('selectDeviceStakingFiatPositions', () => {
    it('has one position per entry with its amount in main units', () => {
        expect(selectDeviceStakingFiatPositions(createState())).toEqual([
            { tickerId: { symbol: 'eth' }, fiatRateKey: 'eth-usd', balance: '2.5' },
            { tickerId: { symbol: 'thod' }, fiatRateKey: 'thod-usd', balance: '2.5' },
            { tickerId: { symbol: 'sol' }, fiatRateKey: 'sol-usd', balance: '5' },
            { tickerId: { symbol: 'ada' }, fiatRateKey: 'ada-usd', balance: '994.75' },
            { tickerId: { symbol: 'trx' }, fiatRateKey: 'trx-usd', balance: '1500' },
        ]);
    });

    it('keys the rates by the base currency', () => {
        expect(
            selectDeviceStakingFiatPositions(createState({ localCurrency: 'eur' })).map(
                ({ fiatRateKey }) => fiatRateKey,
            ),
        ).toEqual(['eth-eur', 'thod-eur', 'sol-eur', 'ada-eur', 'trx-eur']);
    });

    it('keeps the references across a recreated state', () => {
        const first = selectDeviceStakingFiatPositions(createState());

        expect(selectDeviceStakingFiatPositions(createState())).toBe(first);
        expect(selectDeviceStakingFiatPositions(createState())[0]).toBe(first[0]);
    });
});

describe('selectDeviceStakingFiatValuations', () => {
    it('values every position, with zero on a testnet and null without a rate', () => {
        expect(
            selectDeviceStakingFiatValuations(createState()).map(({ tickerId, fiatAmount }) => ({
                symbol: tickerId.symbol,
                fiatAmount: fiatAmount === null ? null : fiatAmount.toFixed(),
            })),
        ).toEqual([
            { symbol: 'eth', fiatAmount: '5000' },
            { symbol: 'thod', fiatAmount: '0' },
            { symbol: 'sol', fiatAmount: null },
            { symbol: 'ada', fiatAmount: '497.375' },
            { symbol: 'trx', fiatAmount: null },
        ]);
    });

    it('keeps the reference across a recreated state', () => {
        expect(selectDeviceStakingFiatValuations(createState())).toBe(
            selectDeviceStakingFiatValuations(createState()),
        );
    });
});

describe('selectDeviceStakingTotalFiatAmount', () => {
    it('sums the valued positions', () => {
        expect(selectDeviceStakingTotalFiatAmount(createState())).toBe('5497.375');
    });

    it('is zero without rates', () => {
        expect(selectDeviceStakingTotalFiatAmount(createState({ rates: {} }))).toBe('0');
    });
});
