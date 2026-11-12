import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { type StakingPosition, stakingAmountSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { toTokenAddress } from '@suite-common/tokens';
import {
    fiatRatesInitialState,
    initialWalletSettingsState,
    selectYieldListItems,
} from '@suite-common/wallet-core';
import {
    type Account,
    type CryptoBaseCurrencyPair,
    type CurrentRate,
    type CurrentRatesByKey,
    type TickerId,
    asAccountDescriptor,
    asTimestamp,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { asNetworkSymbol, asNetworkSymbols } from '@trezor/network-module-types';
import { BigNumber } from '@trezor/utils';

import {
    type EarnRootState,
    selectEarnFiatValuations,
    selectEarnMissingTickerIds,
    selectEarnPositionsCount,
    selectEarnTotalFiatAmount,
    selectIsEarnBalanceBreakdownDisplayed,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
} from './earnSelectors';

const DEVICE_STATIC_SESSION_ID = 'selectedWallet@deviceId:0';
const RECEIPT_TOKEN_CONTRACT = '0x' + 'a'.repeat(40);
const UNDERLYING_TOKEN_CONTRACT = '0x' + 'b'.repeat(40);

const ada = asNetworkSymbol('ada');
const eth = asNetworkSymbol('eth');
const usdcContract = toTokenAddress(UNDERLYING_TOKEN_CONTRACT);
const adaFiatRateKey = getFiatRateKey(ada, 'usd');
const usdcFiatRateKey = getFiatRateKey(eth, 'usd', usdcContract);

const selectedDevice = mockSuiteDevice({
    id: 'selected-device',
    connected: true,
    available: true,
    remember: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const amount = (value: string) => stakingAmountSchema.parse(value);

const adaDescriptor = mockStakingProductDescriptor({
    networkSymbol: ada,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    rewardsKind: 'claimable',
});

const adaAccount = mockWalletAccount({
    symbol: ada,
    descriptor: asAccountDescriptor('ada1'),
    deviceState: DEVICE_STATIC_SESSION_ID,
});

const ethAccount = mockWalletAccount({
    symbol: eth,
    descriptor: asAccountDescriptor('eth1'),
    deviceState: DEVICE_STATIC_SESSION_ID,
    tokens: [mockAccountToken({ contract: RECEIPT_TOKEN_CONTRACT, balance: '1000000' })],
});

// 5 ADA in the stake key.
const adaPosition = mockStakingPosition({
    productId: adaDescriptor.id,
    lockup: 'liquid',
    balances: {
        staked: amount('5000000'),
        pending: amount('0'),
        unstaking: amount('0'),
        withdrawable: amount('0'),
        rewards: amount('0'),
    },
    unlocks: [],
    operations: ['unstake', 'claim', 'vote'],
});

const vault = {
    id: 'vault-usdc',
    network: 'ethereum',
    token: {
        address: UNDERLYING_TOKEN_CONTRACT,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        network: 'ethereum',
    },
    outputToken: {
        address: RECEIPT_TOKEN_CONTRACT,
        symbol: 'vUSDC',
        name: 'Vault USDC',
        decimals: 6,
        network: 'ethereum',
    },
    rewardRate: { total: 0.05 },
} as YieldDtoV2;

const valuedVault = {
    ...vault,
    state: {
        pricePerShareState: {
            shareToken: vault.outputToken,
            quoteToken: vault.token,
            price: '1',
        },
    },
} as YieldDtoV2;

const vaults = [valuedVault];

type RateEntry = { ticker: TickerId; fiatRateKey: CryptoBaseCurrencyPair; rate: number };

const adaRate = (rate: number): RateEntry => ({
    ticker: { symbol: ada },
    fiatRateKey: adaFiatRateKey,
    rate,
});

const usdcRate = (rate: number): RateEntry => ({
    ticker: { symbol: eth, tokenAddress: usdcContract },
    fiatRateKey: usdcFiatRateKey,
    rate,
});

const createRate = ({ ticker, rate }: RateEntry): CurrentRate => ({
    rate,
    usdRate: rate,
    lastTickerTimestamp: asTimestamp(0),
    lastSuccessfulFetchTimestamp: asTimestamp(0),
    isLoading: false,
    error: null,
    ticker,
});

const createRates = (entries: RateEntry[]): CurrentRatesByKey =>
    entries.reduce<CurrentRatesByKey>((ratesByKey, entry) => {
        ratesByKey[entry.fiatRateKey] = createRate(entry);

        return ratesByKey;
    }, {});

const completeRates = createRates([adaRate(0.5), usdcRate(2)]);
const stakingOnlyRates = createRates([adaRate(0.5)]);

type CreateStateParams = {
    accounts?: Account[];
    stakingPositions?: readonly StakingPosition[];
    rates?: CurrentRatesByKey;
};

const createState = ({
    accounts = [adaAccount, ethAccount],
    stakingPositions = [adaPosition],
    rates = {},
}: CreateStateParams = {}): EarnRootState => ({
    earn: {
        staking: mockStakingState({
            descriptors: [adaDescriptor],
            positions: { [adaAccount.key]: stakingPositions },
        }),
    },
    wallet: {
        accounts,
        fiat: { ...fiatRatesInitialState, current: rates },
        settings: initialWalletSettingsState,
    },
    device: { devices: [selectedDevice], selectedDevice, buttonRequestsByPath: {} },
    networks: mockNetworksState(asNetworkSymbols(['eth', 'ada'])),
});

const getYieldFiatAmount = (state: EarnRootState, rate: number) =>
    new BigNumber(selectYieldListItems(state, vaults)[0]?.tokenBalance ?? '0').times(rate);

describe('selectEarnFiatValuations', () => {
    it('lists the staking valuations before the yield valuations', () => {
        const state = createState({ rates: completeRates });

        expect(
            selectEarnFiatValuations(state, vaults).map(({ tickerId, fiatAmount }) => ({
                tickerId,
                fiatAmount: fiatAmount?.toFixed() ?? null,
            })),
        ).toEqual([
            { tickerId: { symbol: ada }, fiatAmount: '2.5' },
            {
                tickerId: { symbol: eth, tokenAddress: usdcContract },
                fiatAmount: getYieldFiatAmount(state, 2).toFixed(),
            },
        ]);
    });

    it('takes staking from the positions, not from the account', () => {
        const state = createState({ stakingPositions: [], rates: completeRates });

        expect(selectEarnFiatValuations(state, vaults).map(({ tickerId }) => tickerId)).toEqual([
            { symbol: eth, tokenAddress: usdcContract },
        ]);
    });

    it('keeps the reference across a recreated state', () => {
        expect(selectEarnFiatValuations(createState({ rates: stakingOnlyRates }), vaults)).toBe(
            selectEarnFiatValuations(createState({ rates: stakingOnlyRates }), vaults),
        );
    });

    it('returns a new reference when a rate changes', () => {
        const first = selectEarnFiatValuations(createState({ rates: stakingOnlyRates }), vaults);
        const second = selectEarnFiatValuations(
            createState({ rates: createRates([adaRate(0.75)]) }),
            vaults,
        );

        expect(second).not.toBe(first);
        expect(second[0]?.fiatAmount?.toFixed()).toBe('3.75');
    });
});

describe('selectEarnTotalFiatAmount', () => {
    it('sums the staking and yield valuations', () => {
        const state = createState({ rates: completeRates });

        expect(selectEarnTotalFiatAmount(state, vaults)).toBe(
            getYieldFiatAmount(state, 2).plus('2.5').toString(),
        );
    });

    it('leaves out a position without a rate', () => {
        expect(selectEarnTotalFiatAmount(createState({ rates: stakingOnlyRates }), vaults)).toBe(
            '2.5',
        );
    });
});

describe('selectEarnMissingTickerIds', () => {
    it('reports the tickers of the positions without a rate', () => {
        expect(
            selectEarnMissingTickerIds(createState({ rates: stakingOnlyRates }), vaults),
        ).toEqual([{ symbol: eth, tokenAddress: usdcContract }]);
    });

    it('returns the shared empty list when every position has a rate', () => {
        expect(selectEarnMissingTickerIds(createState({ rates: completeRates }), vaults)).toBe(
            selectEarnMissingTickerIds(
                createState({ accounts: [], stakingPositions: [], rates: completeRates }),
                vaults,
            ),
        );
    });

    it('keeps the reference across a recreated state', () => {
        expect(selectEarnMissingTickerIds(createState({ rates: stakingOnlyRates }), vaults)).toBe(
            selectEarnMissingTickerIds(createState({ rates: stakingOnlyRates }), vaults),
        );
    });
});

describe('selectIsEarnFiatTotalIncomplete', () => {
    it('is true only while a rate is missing and none is loading', () => {
        const missingState = createState({ rates: stakingOnlyRates });
        const completeState = createState({ rates: completeRates });

        expect(selectIsEarnFiatTotalIncomplete(missingState, vaults, false)).toBe(true);
        expect(selectIsEarnFiatTotalIncomplete(missingState, vaults, true)).toBe(false);
        expect(selectIsEarnFiatTotalIncomplete(completeState, vaults, false)).toBe(false);
    });
});

describe('selectIsEarnFiatTotalUnavailable', () => {
    it('is true only when no position has a rate', () => {
        const partialState = createState({ rates: stakingOnlyRates });
        const unratedState = createState();

        expect(selectIsEarnFiatTotalUnavailable(partialState, vaults, false)).toBe(false);
        expect(selectIsEarnFiatTotalUnavailable(unratedState, vaults, false)).toBe(true);
        expect(selectIsEarnFiatTotalUnavailable(unratedState, vaults, true)).toBe(false);
    });
});

describe('selectIsEarnBalanceBreakdownDisplayed', () => {
    it('shows the breakdown with a staking and a yield position and a complete total', () => {
        expect(
            selectIsEarnBalanceBreakdownDisplayed(
                createState({ rates: completeRates }),
                vaults,
                false,
            ),
        ).toBe(true);
    });

    it('hides it without a staking position', () => {
        expect(
            selectIsEarnBalanceBreakdownDisplayed(
                createState({ stakingPositions: [], rates: completeRates }),
                vaults,
                false,
            ),
        ).toBe(false);
    });

    it('hides it without a yield position', () => {
        expect(
            selectIsEarnBalanceBreakdownDisplayed(createState({ rates: completeRates }), [], false),
        ).toBe(false);
    });

    it('hides it while the total is incomplete', () => {
        expect(
            selectIsEarnBalanceBreakdownDisplayed(
                createState({ rates: stakingOnlyRates }),
                vaults,
                false,
            ),
        ).toBe(false);
    });
});

describe('selectEarnPositionsCount', () => {
    it('adds the staking and yield positions', () => {
        expect(selectEarnPositionsCount(createState(), vaults)).toBe(2);
        expect(selectEarnPositionsCount(createState({ stakingPositions: [] }), vaults)).toBe(1);
        expect(selectEarnPositionsCount(createState(), [])).toBe(1);
        expect(selectEarnPositionsCount(createState({ stakingPositions: [] }), [])).toBe(0);
    });
});
