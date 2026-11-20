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
    selectAccountCoinAssetKey,
    selectIsAssetTableRatePending,
    selectIsAssetTableTotalIncomplete,
} from './accountAssetSelectors';
import {
    type HomeAssetTableState,
    selectHomeAssetTotals,
    selectShownWalletAssetKeys,
    selectWalletAssetAmount,
    selectWalletAssetAvailableAmount,
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
    rates?: Record<
        string,
        { rate?: number; usdRate?: number; error?: string | null; isLoading?: boolean }
    >;
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

const rowsOf = (state: HomeAssetTableState, account: Account) =>
    selectShownWalletAssetKeys(state, account.key).map((assetKey: WalletAssetKey) => [
        selectWalletAssetTokenSymbol(state, assetKey, false, account.key) ??
            selectWalletAssetNetworkSymbol(state, assetKey, false, account.key)?.toUpperCase(),
        selectWalletAssetAmount(state, assetKey, false, account.key),
        selectWalletAssetFiatValue(state, assetKey, false, account.key)?.toFixed(),
    ]);

const totalOf = (state: HomeAssetTableState, account: Account) =>
    selectHomeAssetTotals(state, account.key).fiatValue;

describe('the assets of an account', () => {
    const account = mockAccount({
        tokens: [mockToken(USDC, 'USDC', '1000', 6), mockToken(ENS, 'ENS', '1.12', 18)],
    });
    const rates = { ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) };

    it('lists its coin, its stake counted in, and its tokens, as Home lists the wallet', () => {
        const state = createState([account], {
            rates,
            stakingPositions: { [account.key]: [HALF_ETH_STAKED] },
        });

        expect(rowsOf(state, account)).toEqual([
            ['ETH', '1.7', '5100'],
            ['USDC', '1000', '1000'],
            ['ENS', '1.12', '22.4'],
        ]);
    });

    it('leaves the other accounts of the wallet out', () => {
        const other = mockAccount({
            key: `descriptor1-eth-${ALICE}` as AccountKey,
            formattedBalance: '10',
            tokens: [mockToken(USDC, 'USDC', '7', 6)],
        });
        const state = createState([account, other], { rates });

        expect(rowsOf(state, other)).toEqual([
            ['ETH', '10', '30000'],
            ['USDC', '7', '7'],
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

        expect(rowsOf(createState([testnet]), testnet)).toEqual([['TSEP', '2', undefined]]);
    });
});

describe('the staked share of the coin of an account', () => {
    const splitOf = (state: HomeAssetTableState, account: Account) => {
        const coinKey = selectAccountCoinAssetKey(state, account.key);

        return {
            availableAmount: selectWalletAssetAvailableAmount(state, coinKey, false, account.key),
            stakingAmount: selectWalletAssetStakingAmount(state, coinKey, false, account.key),
            stakingRatio: selectWalletAssetStakingRatio(state, coinKey, false, account.key),
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

    it('counts only the stake of this account, not of another on the same network', () => {
        const account = mockAccount();
        const other = mockAccount({ key: `descriptor1-eth-${ALICE}` as AccountKey });
        const state = createState([account, other], {
            stakingPositions: { [other.key]: [HALF_ETH_STAKED] },
        });

        expect(splitOf(state, account).stakingAmount).toBe('0');
        expect(splitOf(state, other).stakingAmount).toBe('0.5');
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
    const flagsOf = (state: HomeAssetTableState, ofAccount: Account) => ({
        isPending: selectIsAssetTableRatePending(state, ofAccount.key),
        isIncomplete: selectIsAssetTableTotalIncomplete(state, ofAccount.key),
    });

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

    it('keeps a total incomplete while a rate that failed is fetched again', () => {
        // The periodic refresh retries a failed rate; its error stays until the retry settles.
        const retrying = {
            [getFiatRateKey(ETH, 'usd')]: { error: 'Failed to fetch', isLoading: true },
        };
        const state = createState([account], {
            rates: { ...retrying, ...mockRate(1, USDC), ...mockRate(20, ENS) },
        });

        expect(flagsOf(state, account)).toEqual({ isPending: false, isIncomplete: true });
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

        expect(flagsOf(createState([testnet]), testnet)).toEqual({
            isPending: false,
            isIncomplete: false,
        });
    });
});
