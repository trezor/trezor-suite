import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingPositionBalances,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { fiatRatesInitialState, initialWalletSettingsState } from '@suite-common/wallet-core';
import { mockStakeRootState } from '@suite-common/wallet-core/mocks';
import { type CurrentRate, type Timestamp, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { selectAssetCryptoValue, selectAssetFiatValue } from './assetsSelectors';
import { type AssetsRootState } from './types';

const amount = (value: string) => stakingAmountSchema.parse(value);

const balances = (overrides: Partial<StakingPositionBalances>): StakingPositionBalances => ({
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
    ...overrides,
});

const ETH = asNetworkSymbol('eth');
const ADA = asNetworkSymbol('ada');
const TRX = asNetworkSymbol('trx');

const eth = mockStakingProductDescriptor();
const ada = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
});
const trx = mockStakingProductDescriptor({
    networkSymbol: TRX,
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
});

const ethAccount = mockWalletAccount({
    symbol: ETH,
    descriptor: asAccountDescriptor('eth1'),
    availableBalance: '1500000000000000000',
    formattedBalance: '1.5',
    visible: true,
});
const idleEthAccount = mockWalletAccount({
    symbol: ETH,
    descriptor: asAccountDescriptor('eth2'),
    index: 1,
    availableBalance: '1000000000000000000',
    formattedBalance: '1',
    visible: true,
});
const adaAccount = mockWalletAccount({
    symbol: ADA,
    descriptor: asAccountDescriptor('ada1'),
    availableBalance: '1000000000',
    formattedBalance: '1000',
    visible: true,
});
const trxAccount = mockWalletAccount({
    symbol: TRX,
    descriptor: asAccountDescriptor('trx1'),
    availableBalance: '500000000',
    formattedBalance: '500',
    visible: true,
});

const createRate = (symbol: NetworkSymbol, rate: number): CurrentRate => ({
    ticker: { symbol },
    rate,
    usdRate: rate,
    lastTickerTimestamp: 1700000000000 as Timestamp,
    lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
    isLoading: false,
    error: null,
});

const createState = (): AssetsRootState => {
    const state = mockStakeRootState({
        accounts: [ethAccount, idleEthAccount, adaAccount, trxAccount],
    });

    return {
        ...state,
        wallet: {
            ...state.wallet,
            settings: { ...initialWalletSettingsState, localCurrency: 'usd' },
            fiat: {
                ...fiatRatesInitialState,
                current: {
                    [getFiatRateKey(ETH, 'usd')]: createRate(ETH, 2000),
                    [getFiatRateKey(ADA, 'usd')]: createRate(ADA, 0.5),
                    [getFiatRateKey(TRX, 'usd')]: createRate(TRX, 2),
                },
            },
        },
        earn: {
            staking: mockStakingState({
                descriptors: [eth, ada, trx],
                positions: {
                    [ethAccount.key]: [
                        mockStakingPosition({
                            balances: balances({ staked: amount('2050000000000000000') }),
                            unlocks: [],
                        }),
                    ],
                    [adaAccount.key]: [
                        mockStakingPosition({
                            productId: ada.id,
                            lockup: 'liquid',
                            balances: balances({
                                staked: amount('1005250000'),
                                rewards: amount('5250000'),
                            }),
                            unlocks: [],
                            operations: ['unstake', 'claim', 'vote'],
                        }),
                    ],
                    [trxAccount.key]: [
                        mockStakingPosition({
                            productId: trx.id,
                            balances: balances({
                                staked: amount('500000000'),
                                unstaking: amount('200000000'),
                                rewards: amount('1500000'),
                            }),
                            unlocks: [
                                { amount: amount('200000000'), availableAt: 1_800_000_000_000 },
                            ],
                            operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
                        }),
                    ],
                },
            }),
        },
        networks: mockNetworksState([ETH, ADA, TRX]),
    } as AssetsRootState;
};

// The crypto amount and the fiat value of an asset come from one balance: the accounts' available
// balance plus what their positions hold outside it.
describe('selectAssetCryptoValue and selectAssetFiatValue', () => {
    it.each([
        {
            name: 'count frozen TRX and the unfreeze queue, not the unclaimed rewards',
            symbol: TRX,
            cryptoValue: '1200.00000000',
            fiatValue: '2400',
        },
        {
            name: 'count the Cardano reward balance with the liquid balance',
            symbol: ADA,
            cryptoValue: '1005.25000000',
            fiatValue: '502.625',
        },
        {
            name: 'count the locked stake of the staking account and the idle account as it is',
            symbol: ETH,
            cryptoValue: '4.55000000',
            fiatValue: '9100',
        },
    ])('$name', ({ symbol, cryptoValue, fiatValue }) => {
        const state = createState();

        expect(selectAssetCryptoValue(state, symbol)).toBe(cryptoValue);
        expect(selectAssetFiatValue(state, symbol)).toBe(fiatValue);
    });
});
