import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingPosition,
    type StakingPositionBalances,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { FirmwareType, type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import {
    selectAccountAssetTableState,
    selectAccountCoinAssetKey,
    selectIsAssetTableRatePending,
    selectIsAssetTableTotalIncomplete,
} from './accountAssetSelectors';
import {
    type HomeAssetTableState,
    selectDisplayedWalletAssetKeys,
    selectHomeAssetTotals,
    selectShownWalletAssetKeys,
    selectSmallBalanceSummary,
    selectWalletAssetAmount,
    selectWalletAssetAvailableAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetFiatValue,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
    selectWalletAssetTokenSymbol,
} from './homeAssetTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');
const ADA = asNetworkSymbol('ada');
const TSEP = asNetworkSymbol('tsep');

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const ENS = '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72' as TokenAddress;
const HIDDEN = '0x00000000000000000000000000000000000000aa' as TokenAddress;
const UNKNOWN = '0x00000000000000000000000000000000000000bb' as TokenAddress;

const mockToken = (contract: TokenAddress, symbol: string, balance: string, decimals: number) =>
    ({ standard: 'ERC20', contract, symbol, balance, decimals }) satisfies TokenInfo;

const mockAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        key: `descriptor0-eth-${ALICE}` as AccountKey,
        deviceState: ALICE,
        symbol: ETH,
        networkType: 'ethereum',
        formattedBalance: '1.2',
        tokens: [],
        visible: true,
        ...overrides,
    }) as Account;

const ETH_STAKING_PRODUCT = mockStakingProductDescriptor();
const ADA_STAKING_PRODUCT = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    rewardsKind: 'claimable',
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

const HALF_ETH_STAKED = mockStakingPosition({
    balances: balances({ staked: amount('500000000000000000') }),
});

// A current rate carries the dollar rate too; in dollars the two are the same number.
const mockRate = (rate: number, contract?: TokenAddress) => ({
    [getFiatRateKey(ETH, 'usd', contract)]: { rate, usdRate: rate },
});

type CreateStateOptions = {
    rates?: Record<string, { rate?: number; usdRate?: number; error?: string | null }>;
    areSmallBalancesShown?: boolean;
    localCurrency?: 'usd' | 'eur';
    stakingPositions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
};

const createState = (
    accounts: Account[],
    {
        rates = {},
        areSmallBalancesShown = true,
        localCurrency = 'usd',
        stakingPositions = {},
    }: CreateStateOptions = {},
) =>
    ({
        earn: {
            staking: mockStakingState({
                descriptors: [ETH_STAKING_PRODUCT, ADA_STAKING_PRODUCT],
                positions: stakingPositions,
            }),
        },
        device: {
            selectedDevice: {
                state: { staticSessionId: ALICE },
                firmwareType: FirmwareType.Universal,
            },
        },
        wallet: {
            accounts,
            settings: {
                localCurrency,
                enabledNetworks: [ETH, ADA],
                areHomeAssetSmallBalancesShown: areSmallBalancesShown,
            },
            fiat: { current: rates, lastWeek: {}, historic: {} },
        },
        tokenDefinitions: {
            [ETH]: { coin: { data: [USDC, ENS, HIDDEN], hide: [HIDDEN], show: [] } },
        },
        networks: {
            [ETH]: { symbol: ETH, name: 'Ethereum' },
            [ADA]: { symbol: ADA, name: 'Cardano' },
            [TSEP]: { symbol: TSEP, name: 'Sepolia' },
        },
    }) as unknown as HomeAssetTableState;

const scopedTo = (state: HomeAssetTableState, account: Account) =>
    selectAccountAssetTableState(state, account.key);

// How the row names the asset: its token symbol, or the network symbol in capitals.
const labelOf = (scoped: HomeAssetTableState, assetKey: WalletAssetKey) =>
    selectWalletAssetTokenSymbol(scoped, assetKey) ??
    selectWalletAssetNetworkSymbol(scoped, assetKey)?.toUpperCase();

const rowsOf = (state: HomeAssetTableState, account: Account) => {
    const scoped = scopedTo(state, account);

    return selectShownWalletAssetKeys(scoped).map(assetKey => [
        selectWalletAssetContractAddress(scoped, assetKey) === undefined ? 'coin' : 'token',
        labelOf(scoped, assetKey),
        selectWalletAssetAmount(scoped, assetKey),
        selectWalletAssetFiatValue(scoped, assetKey)?.toFixed(),
    ]);
};

const totalOf = (state: HomeAssetTableState, account: Account) =>
    selectHomeAssetTotals(scopedTo(state, account)).fiatValue;

describe('the assets of an account', () => {
    const account = mockAccount({
        tokens: [mockToken(USDC, 'USDC', '1000', 6), mockToken(ENS, 'ENS', '1.12', 18)],
    });
    const stakingPositions = { [account.key]: [HALF_ETH_STAKED] };

    it('counts the stake into the coin, as Home does, and lists the tokens, the most valuable first', () => {
        const state = createState([account], {
            rates: { ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) },
            stakingPositions,
        });

        expect(rowsOf(state, account)).toEqual([
            ['coin', 'ETH', '1.7', '5100'],
            ['token', 'USDC', '1000', '1000'],
            ['token', 'ENS', '1.12', '22.4'],
        ]);
    });

    it('puts what nothing can price last', () => {
        const state = createState([account], { rates: mockRate(1, USDC), stakingPositions });

        expect(rowsOf(state, account).map(([kind, symbol]) => `${kind}:${symbol}`)).toEqual([
            'token:USDC',
            'coin:ETH',
            'token:ENS',
        ]);
    });

    it('leaves out hidden, unrecognized and empty tokens, and an empty coin, as Home does', () => {
        const empty = mockAccount({
            formattedBalance: '0',
            tokens: [
                mockToken(HIDDEN, 'HID', '5', 18),
                mockToken(UNKNOWN, 'BAD', '5', 18),
                mockToken(ENS, 'ENS', '0', 18),
            ],
        } as Partial<Account>);

        expect(rowsOf(createState([empty]), empty)).toEqual([]);
    });

    it('has no rows for an account that is not there', () => {
        const missing = mockAccount({ key: 'missing' as AccountKey });

        expect(rowsOf(createState([]), missing)).toEqual([]);
    });

    it('leaves the other accounts of the wallet out', () => {
        const other = mockAccount({
            key: `descriptor1-eth-${ALICE}` as AccountKey,
            formattedBalance: '10',
            tokens: [mockToken(USDC, 'USDC', '7', 6)],
        });
        const state = createState([account, other], {
            rates: { ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) },
        });

        expect(rowsOf(state, other)).toEqual([
            ['coin', 'ETH', '10', '30000'],
            ['token', 'USDC', '7', '7'],
        ]);
        expect(totalOf(state, other)).toEqual(new BigNumber('30007'));
        expect(totalOf(state, account)).toEqual(new BigNumber('4622.4'));
    });

    it('lists an account on a network the wallet has disabled', () => {
        const testnet = mockAccount({
            key: `descriptor0-tsep-${ALICE}` as AccountKey,
            symbol: TSEP,
            formattedBalance: '2',
        });

        expect(rowsOf(createState([testnet]), testnet)).toEqual([['coin', 'TSEP', '2', undefined]]);
    });
});

describe('the fiat total of an account', () => {
    const account = mockAccount({
        tokens: [mockToken(USDC, 'USDC', '1000', 6), mockToken(ENS, 'ENS', '1.12', 18)],
    });
    // A fetch that failed holds no number and is not tried again until the next refresh.
    const failed = (contract?: TokenAddress) => ({
        [getFiatRateKey(ETH, 'usd', contract)]: { error: 'Failed to fetch' },
    });
    const flagsOf = (state: HomeAssetTableState, ofAccount: Account) => {
        const scoped = scopedTo(state, ofAccount);

        return {
            isPending: selectIsAssetTableRatePending(scoped),
            isIncomplete: selectIsAssetTableTotalIncomplete(scoped),
        };
    };

    it('adds up every priced asset, and marks nothing missing when all of them are', () => {
        const state = createState([account], {
            rates: { ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) },
        });

        expect(totalOf(state, account)).toEqual(new BigNumber('4622.4'));
        expect(flagsOf(state, account)).toEqual({ isPending: false, isIncomplete: false });
    });

    it('adds up what it can, and says a held asset without a rate is missing', () => {
        const state = createState([account], {
            rates: { ...failed(), ...mockRate(1, USDC), ...mockRate(20, ENS) },
        });

        expect(totalOf(state, account)).toEqual(new BigNumber('1022.4'));
        expect(flagsOf(state, account)).toEqual({ isPending: false, isIncomplete: true });
    });

    it('does not call a total incomplete while the rate it lacks is still on its way', () => {
        const state = createState([account], {
            rates: { ...mockRate(1, USDC), ...mockRate(20, ENS) },
        });

        expect(totalOf(state, account)).toEqual(new BigNumber('1022.4'));
        expect(flagsOf(state, account)).toEqual({ isPending: true, isIncomplete: false });
    });

    it('does not miss an empty coin, whatever its rate', () => {
        const empty = mockAccount({
            formattedBalance: '0',
            tokens: [mockToken(USDC, 'USDC', '5', 6)],
        });
        const state = createState([empty], { rates: { ...failed(), ...mockRate(1, USDC) } });

        expect(flagsOf(state, empty).isIncomplete).toBe(false);
    });

    it('has no total while nothing is priced, and waits for rates still on their way', () => {
        const state = createState([account]);

        expect(totalOf(state, account)).toBeUndefined();
        expect(flagsOf(state, account).isPending).toBe(true);
    });

    it('stops waiting once every missing rate has failed', () => {
        const state = createState([account], {
            rates: { ...failed(), ...failed(USDC), ...failed(ENS) },
        });

        expect(flagsOf(state, account).isPending).toBe(false);
    });

    it('never waits for a testnet, which is not priced', () => {
        const testnet = mockAccount({
            key: `descriptor0-tsep-${ALICE}` as AccountKey,
            symbol: TSEP,
            formattedBalance: '2',
        });
        const state = createState([testnet]);

        expect(flagsOf(state, testnet)).toEqual({ isPending: false, isIncomplete: false });
    });
});

describe('the staked share of the coin of an account', () => {
    const splitOf = (state: HomeAssetTableState, account: Account) => {
        const scoped = scopedTo(state, account);
        const coinKey = selectAccountCoinAssetKey(state, account.key);

        return {
            availableAmount: selectWalletAssetAvailableAmount(scoped, coinKey),
            stakingAmount: selectWalletAssetStakingAmount(scoped, coinKey),
            stakingRatio: selectWalletAssetStakingRatio(scoped, coinKey),
        };
    };

    it('splits the coin into what is staked and what is not', () => {
        const account = mockAccount();
        const state = createState([account], {
            stakingPositions: { [account.key]: [HALF_ETH_STAKED] },
        });

        expect(splitOf(state, account)).toEqual({
            availableAmount: '1.2',
            stakingAmount: '0.5',
            stakingRatio: 0.5 / 1.7,
        });
    });

    it('counts a liquid Cardano delegation as the whole balance staked, none of it unstaked', () => {
        const cardano = mockAccount({
            key: `descriptor0-ada-${ALICE}` as AccountKey,
            symbol: ADA,
            networkType: 'cardano',
            formattedBalance: '3',
        });
        const state = createState([cardano], {
            stakingPositions: {
                [cardano.key]: [
                    mockStakingPosition({
                        productId: ADA_STAKING_PRODUCT.id,
                        lockup: 'liquid',
                        balances: balances({ staked: amount('3000000') }),
                        unlocks: [],
                        operations: ['unstake', 'claim', 'vote'],
                    }),
                ],
            },
        });

        expect(splitOf(state, cardano)).toEqual({
            availableAmount: '0',
            stakingAmount: '3',
            stakingRatio: 1,
        });
    });

    it('counts only the stake of this account, not of another on the same network', () => {
        const account = mockAccount();
        const other = mockAccount({ key: `descriptor1-eth-${ALICE}` as AccountKey });
        const state = createState([account, other], {
            stakingPositions: { [other.key]: [HALF_ETH_STAKED] },
        });

        expect(splitOf(state, account).stakingAmount).toBe('0');
        expect(splitOf(state, other).stakingAmount).toBe('0.5');
    });

    it('has no share to show for an empty account', () => {
        const empty = mockAccount({ formattedBalance: '0' });

        expect(splitOf(createState([empty]), empty).stakingRatio).toBeUndefined();
    });
});

describe('the small balances of an account', () => {
    const dust = mockAccount({
        formattedBalance: '0',
        tokens: [mockToken(USDC, 'USDC', '1000', 6), mockToken(ENS, 'ENS', '0.03', 18)],
    } as Partial<Account>);
    const rates = { ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) };
    const displayed = (state: HomeAssetTableState) => {
        const scoped = scopedTo(state, dust);

        return selectDisplayedWalletAssetKeys(scoped).map(assetKey => labelOf(scoped, assetKey));
    };

    it('counts a token worth under a dollar, and lists it only while they are shown', () => {
        const shown = createState([dust], { rates });
        const hidden = createState([dust], { rates, areSmallBalancesShown: false });

        const summary = selectSmallBalanceSummary(scopedTo(shown, dust));

        expect(summary?.assetCount).toBe(1);
        expect(summary?.fiatValue.toFixed()).toBe('0.6');
        expect(displayed(shown)).toEqual(['USDC', 'ENS']);
        expect(displayed(hidden)).toEqual(['USDC']);
    });

    it('hides nothing until a dollar is known in the chosen currency', () => {
        const state = createState([dust], {
            rates: { [getFiatRateKey(ETH, 'eur', ENS)]: { rate: 18 } },
            areSmallBalancesShown: false,
            localCurrency: 'eur',
        });

        expect(selectSmallBalanceSummary(scopedTo(state, dust))).toBeUndefined();
        expect(displayed(state)).toEqual(['ENS', 'USDC']);
    });
});
