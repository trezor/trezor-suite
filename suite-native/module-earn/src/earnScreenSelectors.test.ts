import { type ChainRewardsWithFiat, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { FIVE_BINARIES_POOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import { fiatRatesInitialState, initialWalletSettingsState } from '@suite-common/wallet-core';
import {
    type Account,
    type CryptoBaseCurrencyPair,
    type Rate,
    type RatesByKey,
    type TickerId,
    asAccountDescriptor,
    asBaseCurrencyAmount,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    mockAccountToken,
    mockWalletAccount,
    networkSpecificDefaultCardano,
} from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { appSettingsInitialState } from '@suite-native/settings';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import {
    type EarnListRootState,
    selectCardanoStakedWithFiveBinariesAccountKey,
    selectEarnFiatValuations,
    selectEarnMissingTickerIds,
    selectEarnTotalFiatAmount,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
    selectStakingFiatPositions,
    selectStakingListItems,
    selectStakingListSymbols,
    selectStakingTotalFiatAmount,
    selectYieldClaimAccountItems,
    selectYieldClaimAccounts,
    selectYieldClaimListItems,
    selectYieldClaimTokens,
    selectYieldClaimTotalFiatAmount,
    selectYieldFiatPositions,
    selectYieldListItems,
    selectYieldListVaultIcons,
    selectYieldPromoListItems,
    selectYieldTotalFiatAmount,
} from './earnScreenSelectors';

const DEVICE_STATIC_SESSION_ID: StaticSessionId = 'selectedWallet@deviceId:0';
const OTHER_DEVICE_STATIC_SESSION_ID: StaticSessionId = 'otherWallet@otherDeviceId:0';
const RECEIPT_TOKEN_CONTRACT = '0x' + 'a'.repeat(40);
const UNDERLYING_TOKEN_CONTRACT = '0x' + 'b'.repeat(40);
const REWARD_TOKEN_CONTRACT = '0x' + 'c'.repeat(40);

const selectedDevice = mockSuiteDevice({
    id: 'selected-device',
    connected: true,
    available: true,
    remember: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const createAdaAccount = (descriptor: string, balance: string, visible = true) =>
    mockWalletAccount(
        {
            symbol: asNetworkSymbol('ada'),
            descriptor: asAccountDescriptor(descriptor),
            deviceState: DEVICE_STATIC_SESSION_ID,
            balance,
            visible,
        },
        networkSpecificDefaultCardano,
    );

const createFiveBinariesAdaAccount = (descriptor: string, visible = true): Account => {
    const account = createAdaAccount(descriptor, '5000000', visible);

    if (account.networkType !== 'cardano') return account;

    return {
        ...account,
        misc: {
            ...account.misc,
            staking: { ...account.misc.staking, poolId: FIVE_BINARIES_POOLS[0] ?? null },
        },
    };
};

const createBtcAccount = (descriptor: string, balance = '1') =>
    mockWalletAccount({
        symbol: asNetworkSymbol('btc'),
        descriptor: asAccountDescriptor(descriptor),
        deviceState: DEVICE_STATIC_SESSION_ID,
        balance,
    });

const createEthAccount = (descriptor: string, receiptTokenBalance?: string) =>
    mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor(descriptor),
        deviceState: DEVICE_STATIC_SESSION_ID,
        tokens: receiptTokenBalance
            ? [mockAccountToken({ contract: RECEIPT_TOKEN_CONTRACT, balance: receiptTokenBalance })]
            : [],
    });

const networksState = mockNetworksState(mockGetSupportedNetworks());

const getRecomputations = (selector: unknown): number =>
    (selector as { recomputations: () => number }).recomputations();

const createState = (
    accounts: Account[],
    currentFiatRates: RatesByKey = {},
): EarnListRootState => ({
    networks: networksState,
    device: {
        devices: [selectedDevice],
        selectedDevice,
    },
    wallet: {
        accounts,
        settings: initialWalletSettingsState,
        fiat: { ...fiatRatesInitialState, current: currentFiatRates },
    },
    appSettings: appSettingsInitialState,
});

type RateEntry = { ticker: TickerId; fiatRateKey: CryptoBaseCurrencyPair; rate: number };

const createRate = ({ ticker, rate }: RateEntry): Rate => ({
    rate,
    lastTickerTimestamp: asTimestamp(0),
    lastSuccessfulFetchTimestamp: asTimestamp(0),
    isLoading: false,
    error: null,
    ticker,
});

const createRates = (entries: RateEntry[]): RatesByKey =>
    entries.reduce<RatesByKey>((ratesByKey, entry) => {
        ratesByKey[entry.fiatRateKey] = createRate(entry);

        return ratesByKey;
    }, {});

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

describe('selectStakingListItems', () => {
    it('lists visible accounts with active staking', () => {
        const stakedAccount = createAdaAccount('adastaked', '5000000');
        const state = createState([
            createEthAccount('ethnostaking'),
            createAdaAccount('adahidden', '7000000', false),
            stakedAccount,
        ]);

        expect(selectStakingListItems(state)).toEqual([
            { symbol: asNetworkSymbol('ada'), accountKey: stakedAccount.key, balance: '5' },
        ]);
        expect(selectStakingListSymbols(state)).toEqual([asNetworkSymbol('ada')]);
    });

    it('keeps item and array references across recreated state', () => {
        const accounts = [createAdaAccount('adafirst', '5000000'), createEthAccount('eth')];
        const firstItems = selectStakingListItems(createState([...accounts]));
        const secondItems = selectStakingListItems(createState([...accounts]));

        expect(secondItems).toBe(firstItems);
        expect(secondItems[0]).toBe(firstItems[0]);
        expect(selectStakingListSymbols(createState([...accounts]))).toBe(
            selectStakingListSymbols(createState([...accounts])),
        );
    });

    it('skips recomputation when an unrelated account changes', () => {
        const stakedAccount = createAdaAccount('adastaked', '5000000');
        const firstItems = selectStakingListItems(
            createState([stakedAccount, createBtcAccount('btcunrelated')]),
        );
        const recomputations = getRecomputations(selectStakingListItems);

        const secondItems = selectStakingListItems(
            createState([stakedAccount, createBtcAccount('btcunrelated', '2')]),
        );

        expect(secondItems).toBe(firstItems);
        expect(getRecomputations(selectStakingListItems)).toBe(recomputations);
    });

    it('returns a stable empty array when nothing is staked', () => {
        expect(selectStakingListItems(createState([createEthAccount('eth')]))).toBe(
            selectStakingListItems(createState([])),
        );
    });

    it('excludes cardano accounts delegated with a zero balance', () => {
        const stakedAccount = createAdaAccount('adastaked', '5000000');
        const state = createState([createAdaAccount('adaempty', '0'), stakedAccount]);

        expect(selectStakingListItems(state)).toEqual([
            { symbol: asNetworkSymbol('ada'), accountKey: stakedAccount.key, balance: '5' },
        ]);
        expect(selectStakingListItems(createState([createAdaAccount('adaempty', '0')]))).toBe(
            selectStakingListItems(createState([])),
        );
    });
});

describe('selectCardanoStakedWithFiveBinariesAccountKey', () => {
    it('returns the first visible cardano account staked with Five Binaries', () => {
        const fiveBinariesAccount = createFiveBinariesAdaAccount('adafivebinaries');
        const state = createState([
            createAdaAccount('adaeverstake', '5000000'),
            createFiveBinariesAdaAccount('adahidden', false),
            fiveBinariesAccount,
        ]);

        expect(selectCardanoStakedWithFiveBinariesAccountKey(state)).toBe(fiveBinariesAccount.key);
    });

    it('returns null when no cardano account is staked with Five Binaries', () => {
        expect(
            selectCardanoStakedWithFiveBinariesAccountKey(
                createState([createAdaAccount('adaeverstake', '5000000'), createEthAccount('eth')]),
            ),
        ).toBeNull();
    });
});

describe('selectYieldClaimAccounts', () => {
    it('lists only ethereum accounts with claim support and keeps the reference', () => {
        const ethAccount = createEthAccount('ethclaim');
        const accounts = [createAdaAccount('ada', '5000000'), ethAccount];
        const firstAccounts = selectYieldClaimAccounts(createState([...accounts]));
        const secondAccounts = selectYieldClaimAccounts(createState([...accounts]));

        expect(firstAccounts).toEqual([ethAccount]);
        expect(secondAccounts).toBe(firstAccounts);
    });
});

const createReward = ({
    claimable,
    fiatClaimable,
    tokenAddress = REWARD_TOKEN_CONTRACT,
}: {
    claimable: string;
    fiatClaimable: string | null;
    tokenAddress?: string;
}): ChainRewardsWithFiat['rewards'][number] => ({
    root: '0xroot',
    amount: claimable,
    claimed: '0',
    pending: '0',
    token: { address: tokenAddress, chainId: 1, symbol: 'USDC', decimals: 6 },
    proofs: [],
    claimable: asBaseCurrencyAmount(new BigNumber(claimable)),
    fiat: {
        amount: null,
        claimed: null,
        pending: null,
        claimable:
            fiatClaimable === null ? null : asBaseCurrencyAmount(new BigNumber(fiatClaimable)),
    },
});

const createChainRewards = (
    account: Account,
    rewards: ChainRewardsWithFiat['rewards'],
): ChainRewardsWithFiat => ({
    chainId: 1,
    address: account.descriptor,
    totalClaimable: rewards
        .reduce((total, reward) => total.plus(reward.claimable), new BigNumber(0))
        .toFixed(),
    rewards,
});

describe('selectYieldClaimListItems', () => {
    const claimAccount = createEthAccount('ethclaimer', '1000000');
    const emptyAccount = createEthAccount('ethnoclaim');
    const createRewards = () => [
        createChainRewards(claimAccount, [
            createReward({ claimable: '1000000', fiatClaimable: '1.25' }),
            createReward({ claimable: '500000', fiatClaimable: '0.75' }),
        ]),
        createChainRewards(emptyAccount, [createReward({ claimable: '0', fiatClaimable: '0' })]),
    ];

    it('builds one claim item per account with claimable rewards', () => {
        const state = createState([createAdaAccount('ada', '5000000'), emptyAccount, claimAccount]);

        expect(selectYieldClaimListItems(state, createRewards())).toEqual([
            {
                accountKey: claimAccount.key,
                networkSymbol: asNetworkSymbol('eth'),
                claimableRewardsCount: 2,
                fiatClaimableAmount: expect.anything(),
                tokens: [
                    {
                        networkSymbol: asNetworkSymbol('eth'),
                        contractAddress: REWARD_TOKEN_CONTRACT,
                        symbol: 'USDC',
                        decimals: 6,
                        claimableAmount: '1.5',
                    },
                ],
            },
        ]);
        expect(
            selectYieldClaimListItems(state, createRewards())[0]?.fiatClaimableAmount?.toString(),
        ).toBe('2');
        expect(selectYieldClaimTokens(state, createRewards())).toEqual([
            {
                networkSymbol: asNetworkSymbol('eth'),
                contractAddress: REWARD_TOKEN_CONTRACT,
                symbol: 'USDC',
            },
        ]);
        expect(selectYieldClaimTotalFiatAmount(state, createRewards())?.toString()).toBe('2');
    });

    it('returns null total when any claim item lacks a fiat value', () => {
        const state = createState([claimAccount]);
        const rewards = [
            createChainRewards(claimAccount, [
                createReward({ claimable: '1000000', fiatClaimable: null }),
            ]),
        ];

        expect(selectYieldClaimListItems(state, rewards)[0]?.fiatClaimableAmount).toBeNull();
        expect(selectYieldClaimTotalFiatAmount(state, rewards)).toBeNull();
    });

    it('keeps item, token, total and account item references across recreated accounts', () => {
        const rewards = createRewards();
        const createRecreatedState = () =>
            createState([{ ...claimAccount }, { ...emptyAccount }, createAdaAccount('ada', '1')]);
        const first = selectYieldClaimListItems(createRecreatedState(), rewards);
        const second = selectYieldClaimListItems(createRecreatedState(), rewards);

        expect(second).toBe(first);
        expect(second[0]).toBe(first[0]);
        expect(second[0]?.tokens).toBe(first[0]?.tokens);
        expect(second[0]?.fiatClaimableAmount).toBe(first[0]?.fiatClaimableAmount);
        expect(selectYieldClaimTokens(createRecreatedState(), rewards)).toBe(
            selectYieldClaimTokens(createRecreatedState(), rewards),
        );
        expect(selectYieldClaimTotalFiatAmount(createRecreatedState(), rewards)).toBe(
            selectYieldClaimTotalFiatAmount(createRecreatedState(), rewards),
        );
        expect(selectYieldClaimAccountItems(createRecreatedState(), rewards, [vault])).toBe(
            selectYieldClaimAccountItems(createRecreatedState(), rewards, [vault]),
        );
    });

    it('keeps token references when the rewards data is refreshed', () => {
        const state = createState([claimAccount, emptyAccount]);
        const firstTokens = selectYieldClaimTokens(state, createRewards());
        const secondTokens = selectYieldClaimTokens(state, createRewards());

        expect(secondTokens).toBe(firstTokens);
    });

    it('returns a new reference when a claimable amount changes', () => {
        const state = createState([claimAccount]);
        const buildFor = (claimable: string) =>
            selectYieldClaimListItems(state, [
                createChainRewards(claimAccount, [
                    createReward({ claimable, fiatClaimable: '1.25' }),
                ]),
            ]);

        expect(buildFor('2000000')).not.toBe(buildFor('1000000'));
    });

    it('attaches the account vault positions to the claim account items', () => {
        const state = createState([claimAccount, emptyAccount]);
        const secondVault = { ...vault, id: 'vault-second' } as YieldDtoV2;

        expect(selectYieldClaimAccountItems(state, createRewards(), [vault, secondVault])).toEqual([
            {
                summary: expect.objectContaining({ accountKey: claimAccount.key }),
                vaults: [
                    { name: 'Vault USDC', tokenContract: UNDERLYING_TOKEN_CONTRACT },
                    { name: 'Vault USDC', tokenContract: UNDERLYING_TOKEN_CONTRACT },
                ],
            },
        ]);
        expect(selectYieldClaimAccountItems(state, createRewards(), [])).toEqual([
            { summary: expect.objectContaining({ accountKey: claimAccount.key }), vaults: [] },
        ]);
    });
});

describe('selectYieldListItems', () => {
    it('lists accounts holding the vault receipt token', () => {
        const positionAccount = createEthAccount('ethposition', '1000000');
        const state = createState([createEthAccount('ethempty'), positionAccount]);

        expect(selectYieldListItems(state, [vault])).toEqual([
            expect.objectContaining({
                id: `${vault.id}-${positionAccount.key}`,
                networkSymbol: asNetworkSymbol('eth'),
                tokenSymbol: 'USDC',
                vaultName: 'Vault USDC',
                apy: 5,
                underlyingTokenContract: UNDERLYING_TOKEN_CONTRACT,
                receiptTokenContract: RECEIPT_TOKEN_CONTRACT,
                contractAddress: RECEIPT_TOKEN_CONTRACT,
                tokenContractAddress: UNDERLYING_TOKEN_CONTRACT,
                accountKey: positionAccount.key,
            }),
        ]);
    });

    it('keeps item and array references across recreated state', () => {
        const accounts = [createEthAccount('ethposition', '1000000')];
        const firstItems = selectYieldListItems(createState([...accounts]), [vault]);
        const secondItems = selectYieldListItems(createState([...accounts]), [vault]);

        expect(secondItems).toBe(firstItems);
        expect(secondItems[0]).toBe(firstItems[0]);
    });

    it('skips recomputation when accounts without a position change', () => {
        const yieldOpportunities = [vault];
        const positionAccount = createEthAccount('ethposition', '1000000');
        const unrelatedAccount = createEthAccount('ethunrelated');
        const otherDeviceAccount = {
            ...createEthAccount('ethotherdevice', '1000000'),
            deviceState: OTHER_DEVICE_STATIC_SESSION_ID,
        };
        const firstItems = selectYieldListItems(
            createState([positionAccount, unrelatedAccount]),
            yieldOpportunities,
        );
        const recomputations = getRecomputations(selectYieldListItems);

        const secondItems = selectYieldListItems(
            createState([
                positionAccount,
                { ...unrelatedAccount, balance: '2' },
                otherDeviceAccount,
            ]),
            yieldOpportunities,
        );

        expect(secondItems).toBe(firstItems);
        expect(getRecomputations(selectYieldListItems)).toBe(recomputations);
    });

    it('recomputes when a position account loses its position', () => {
        const yieldOpportunities = [vault];
        const firstItems = selectYieldListItems(
            createState([createEthAccount('ethposition', '1000000')]),
            yieldOpportunities,
        );
        const recomputations = getRecomputations(selectYieldListItems);

        const secondItems = selectYieldListItems(
            createState([createEthAccount('ethposition')]),
            yieldOpportunities,
        );

        expect(firstItems).toHaveLength(1);
        expect(secondItems).toEqual([]);
        expect(getRecomputations(selectYieldListItems)).toBe(recomputations + 1);
    });

    it('orders positions by network token order and account index instead of the API order', () => {
        const usdtReceiptTokenContract = '0x' + 'd'.repeat(40);
        const usdtVault = {
            ...vault,
            id: 'vault-usdt',
            token: { ...vault.token, symbol: 'USDT', name: 'Tether' },
            outputToken: {
                ...vault.outputToken,
                address: usdtReceiptTokenContract,
                symbol: 'vUSDT',
                name: 'Vault USDT',
            },
        } as YieldDtoV2;
        const secondAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            descriptor: asAccountDescriptor('ethsecond'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            index: 1,
            tokens: [mockAccountToken({ contract: RECEIPT_TOKEN_CONTRACT, balance: '1000000' })],
        });
        const firstAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            descriptor: asAccountDescriptor('ethfirst'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            index: 0,
            tokens: [
                mockAccountToken({ contract: usdtReceiptTokenContract, balance: '1000000' }),
                mockAccountToken({ contract: RECEIPT_TOKEN_CONTRACT, balance: '1000000' }),
            ],
        });
        const state = createState([secondAccount, firstAccount]);

        expect(
            selectYieldListItems(state, [usdtVault, vault]).map(({ id, accountKey }) => ({
                id,
                accountKey,
            })),
        ).toEqual([
            { id: `${vault.id}-${firstAccount.key}`, accountKey: firstAccount.key },
            { id: `${vault.id}-${secondAccount.key}`, accountKey: secondAccount.key },
            { id: `${usdtVault.id}-${firstAccount.key}`, accountKey: firstAccount.key },
        ]);
    });

    it('returns a new reference when a position balance changes', () => {
        const sameTokenVault = {
            ...vault,
            token: { ...vault.token, address: RECEIPT_TOKEN_CONTRACT },
        } as YieldDtoV2;
        const firstItems = selectYieldListItems(
            createState([createEthAccount('ethposition', '1000000')]),
            [sameTokenVault],
        );
        const secondItems = selectYieldListItems(
            createState([createEthAccount('ethposition', '2000000')]),
            [sameTokenVault],
        );

        expect(secondItems).not.toBe(firstItems);
    });
});

describe('selectYieldPromoListItems', () => {
    const state = createState([]);

    it('maps vaults to promo items regardless of account positions', () => {
        expect(selectYieldPromoListItems(state, [vault])).toEqual([
            {
                id: vault.id,
                yieldId: vault.id,
                vaultName: 'Vault USDC',
                tokenSymbol: 'USDC',
                networkSymbol: asNetworkSymbol('eth'),
                underlyingTokenContract: UNDERLYING_TOKEN_CONTRACT,
                receiptTokenContract: RECEIPT_TOKEN_CONTRACT,
                contractAddress: UNDERLYING_TOKEN_CONTRACT,
                tokenContractAddress: UNDERLYING_TOKEN_CONTRACT,
                apy: 5,
                token: vault.token,
                outputToken: vault.outputToken,
                pricePerShareState: undefined,
            },
        ]);
    });

    it('skips vaults on unknown networks or without a token address', () => {
        const unknownNetworkVault = {
            ...vault,
            id: 'vault-unknown',
            network: 'unknown',
        } as unknown as YieldDtoV2;
        const noAddressVault = {
            ...vault,
            id: 'vault-no-address',
            token: { ...vault.token, address: undefined },
        } as unknown as YieldDtoV2;

        expect(
            selectYieldPromoListItems(state, [unknownNetworkVault, noAddressVault, vault]).map(
                ({ id }) => id,
            ),
        ).toEqual([vault.id]);
    });

    it('sets a null receipt token contract and apy when the vault has none', () => {
        const noOutputVault = {
            ...vault,
            outputToken: undefined,
            rewardRate: { total: 0 },
        } as unknown as YieldDtoV2;

        expect(selectYieldPromoListItems(state, [noOutputVault])).toEqual([
            expect.objectContaining({ vaultName: '', receiptTokenContract: null, apy: null }),
        ]);
    });

    it('orders vaults by apy descending instead of the API order', () => {
        const lowApyVault = {
            ...vault,
            id: 'vault-low',
            rewardRate: { total: 0.01 },
        } as YieldDtoV2;
        const highApyVault = {
            ...vault,
            id: 'vault-high',
            rewardRate: { total: 0.1 },
        } as YieldDtoV2;

        expect(
            selectYieldPromoListItems(state, [lowApyVault, vault, highApyVault]).map(
                ({ id }) => id,
            ),
        ).toEqual([highApyVault.id, vault.id, lowApyVault.id]);
    });

    it('keeps item and array references across recreated state', () => {
        const firstItems = selectYieldPromoListItems(createState([]), [vault]);
        const secondItems = selectYieldPromoListItems(createState([]), [vault]);

        expect(secondItems).toBe(firstItems);
        expect(secondItems[0]).toBe(firstItems[0]);
    });

    it('returns a stable empty array when there are no vaults', () => {
        expect(selectYieldPromoListItems(state, [])).toBe(selectYieldPromoListItems(state, []));
    });
});

describe('selectYieldListVaultIcons', () => {
    it('lists each vault once when several accounts hold the same receipt token', () => {
        const state = createState([
            createEthAccount('ethfirst', '1000000'),
            createEthAccount('ethsecond', '2000000'),
        ]);

        expect(selectYieldListItems(state, [vault])).toHaveLength(2);
        expect(selectYieldListVaultIcons(state, [vault])).toEqual([
            {
                networkSymbol: asNetworkSymbol('eth'),
                tokenSymbol: 'USDC',
                tokenContractAddress: UNDERLYING_TOKEN_CONTRACT,
            },
        ]);
    });

    it('keeps icon and array references across recreated state', () => {
        const accounts = [createEthAccount('ethposition', '1000000')];
        const firstIcons = selectYieldListVaultIcons(createState([...accounts]), [vault]);
        const secondIcons = selectYieldListVaultIcons(createState([...accounts]), [vault]);

        expect(secondIcons).toBe(firstIcons);
        expect(secondIcons[0]).toBe(firstIcons[0]);
    });

    it('returns a stable empty array when there are no positions', () => {
        expect(
            selectYieldListVaultIcons(createState([createEthAccount('ethempty')]), [vault]),
        ).toBe(selectYieldListVaultIcons(createState([]), [vault]));
    });
});

describe('earn fiat selectors', () => {
    const adaSymbol = asNetworkSymbol('ada');
    const ethSymbol = asNetworkSymbol('eth');
    const usdcContract = toTokenAddress(UNDERLYING_TOKEN_CONTRACT);
    const adaFiatRateKey = getFiatRateKey(adaSymbol, 'usd');
    const usdcFiatRateKey = getFiatRateKey(ethSymbol, 'usd', usdcContract);
    const adaRate = (rate: number): RateEntry => ({
        ticker: { symbol: adaSymbol },
        fiatRateKey: adaFiatRateKey,
        rate,
    });
    const usdcRate = (rate: number): RateEntry => ({
        ticker: { symbol: ethSymbol, tokenAddress: usdcContract },
        fiatRateKey: usdcFiatRateKey,
        rate,
    });

    const stakedAccount = createAdaAccount('adastaked', '5000000');
    const positionAccount = createEthAccount('ethposition', '1000000');
    const accounts = [stakedAccount, positionAccount];

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

    const getYieldTokenBalance = (state: EarnListRootState) =>
        selectYieldListItems(state, [valuedVault])[0]?.tokenBalance ?? '0';

    it('projects one fiat position per valued staking and yield item', () => {
        const state = createState(accounts);

        expect(selectStakingFiatPositions(state)).toEqual([
            { tickerId: { symbol: adaSymbol }, fiatRateKey: adaFiatRateKey, balance: '5' },
        ]);
        expect(selectYieldFiatPositions(state, [valuedVault])).toEqual([
            {
                tickerId: { symbol: ethSymbol, tokenAddress: usdcContract },
                fiatRateKey: usdcFiatRateKey,
                balance: getYieldTokenBalance(state),
            },
        ]);
    });

    it('sums staking, yield and earn totals from the current rates', () => {
        const state = createState(accounts, createRates([adaRate(0.5), usdcRate(2)]));
        const yieldFiatAmount = new BigNumber(getYieldTokenBalance(state)).times(2);

        expect(selectStakingTotalFiatAmount(state)).toBe('2.5');
        expect(selectYieldTotalFiatAmount(state, [valuedVault])).toBe(yieldFiatAmount.toString());
        expect(selectEarnTotalFiatAmount(state, [valuedVault])).toBe(
            yieldFiatAmount.plus('2.5').toString(),
        );
    });

    it('excludes positions without a rate from the total and reports their tickers', () => {
        const state = createState(accounts, createRates([adaRate(0.5)]));

        expect(selectEarnTotalFiatAmount(state, [valuedVault])).toBe('2.5');
        expect(selectEarnMissingTickerIds(state, [valuedVault])).toEqual([
            { symbol: ethSymbol, tokenAddress: usdcContract },
        ]);
    });

    it('returns a stable empty ticker list when every position has a rate', () => {
        const rates = createRates([adaRate(0.5), usdcRate(2)]);

        expect(selectEarnMissingTickerIds(createState(accounts, rates), [valuedVault])).toBe(
            selectEarnMissingTickerIds(createState([], rates), [valuedVault]),
        );
    });

    it('keeps valuation and ticker references across recreated state', () => {
        const rates = createRates([adaRate(0.5)]);
        const firstState = createState([...accounts], rates);
        const secondState = createState([...accounts], rates);

        expect(selectEarnFiatValuations(secondState, [valuedVault])).toBe(
            selectEarnFiatValuations(firstState, [valuedVault]),
        );
        expect(selectEarnMissingTickerIds(secondState, [valuedVault])).toBe(
            selectEarnMissingTickerIds(firstState, [valuedVault]),
        );
    });

    it('returns a new valuation reference when a rate changes', () => {
        const firstValuations = selectEarnFiatValuations(
            createState(accounts, createRates([adaRate(0.5)])),
            [valuedVault],
        );
        const secondValuations = selectEarnFiatValuations(
            createState(accounts, createRates([adaRate(0.75)])),
            [valuedVault],
        );

        expect(secondValuations).not.toBe(firstValuations);
        expect(secondValuations[0]?.fiatAmount?.toFixed()).toBe('3.75');
    });

    it('marks the total incomplete only when rates are missing and not loading', () => {
        const missingState = createState(accounts, createRates([adaRate(0.5)]));
        const completeState = createState(accounts, createRates([adaRate(0.5), usdcRate(2)]));

        expect(selectIsEarnFiatTotalIncomplete(missingState, [valuedVault], false)).toBe(true);
        expect(selectIsEarnFiatTotalIncomplete(missingState, [valuedVault], true)).toBe(false);
        expect(selectIsEarnFiatTotalIncomplete(completeState, [valuedVault], false)).toBe(false);
    });

    it('marks the total unavailable only when no position has a rate', () => {
        const partialState = createState(accounts, createRates([adaRate(0.5)]));
        const emptyState = createState(accounts);

        expect(selectIsEarnFiatTotalUnavailable(partialState, [valuedVault], false)).toBe(false);
        expect(selectIsEarnFiatTotalUnavailable(emptyState, [valuedVault], false)).toBe(true);
        expect(selectIsEarnFiatTotalUnavailable(emptyState, [valuedVault], true)).toBe(false);
    });
});
