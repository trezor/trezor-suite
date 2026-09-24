import { type DeviceRootState } from '@suite-common/device';
import { type ChainRewardsWithFiat, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type NetworksRootState,
    asNetworkSymbol,
    selectSupportedNetworkSymbols,
} from '@suite-common/networks';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    PROD_STAKING_SYMBOLS,
    STAKING_SYMBOLS,
    getNetworkByYieldXyzId,
    isEarnYieldClaimSupported,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type EarnFiatPosition,
    type EarnFiatValuation,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    createStableFiatRateKeys,
    createStableTickerId,
    createStableTickerIds,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getEarnMissingRateTickerIds,
    getEarnPositionFiatAmount,
    hasAnyEarnFiatRate,
    isCardanoStakedWithFiveBinaries,
    selectBaseCurrency,
    selectCurrentFiatRatesByFiatRateKeys,
    selectVisibleDeviceAccounts,
    sumEarnFiatValuations,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyAmount,
    type CryptoBaseCurrencyPair,
    type RatesByKey,
    type TickerId,
    type TokenAddress,
    type TokenSymbol,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    compareEarnByApyDesc,
    compareEarnByNetworkTokenOrder,
    getAccountTotalStakingBalance,
    getContractAddressForNetworkSymbol,
    getFiatRateKey,
    isStakingSymbol,
    sortByCoin,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { type YieldClaimVaultParams } from '@suite-native/navigation';
import { type SettingsSliceRootState, selectAreTestnetsEnabled } from '@suite-native/settings';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber, isNotNull } from '@trezor/utils';

import {
    type StakingListItem,
    type YieldClaimAccountItem,
    type YieldClaimListItem,
    type YieldClaimRewardToken,
    type YieldClaimToken,
    type YieldListItem,
    type YieldListItemWithAccount,
    type YieldListVaultIcon,
    type YieldOpportunity,
    type YieldPromoListItem,
} from './types';
import { hasPositiveContractTokenBalance } from './utils/earn/contractTokenBalanceUtils';
import {
    getAccountChainRewards,
    getChainsRewardsByAccountKey,
    getClaimableRewards,
    getTotalFiatAmountFromClaimableRewards,
    sumBaseCurrencyAmounts,
} from './utils/yield/stablecoinYieldClaimSummaryUtils';

export type EarnListRootState = AccountsRootState &
    DeviceRootState &
    NetworksRootState &
    WalletSettingsRootState &
    FiatRatesRootState &
    SettingsSliceRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<EarnListRootState>();

const createStableArray = weakMapMemoize(<T>(...items: T[]) => items);

const createStakingListItem = weakMapMemoize(
    (symbol: NetworkSymbol, accountKey: AccountKey, balance: string): StakingListItem => ({
        symbol,
        accountKey,
        balance,
    }),
);

const getStakingPositionBalance = (account: Account): string | null => {
    const stakingBalance = getAccountTotalStakingBalance(account);

    if (stakingBalance === null || new BigNumber(stakingBalance).isZero()) return null;

    return stakingBalance;
};

const selectStakingSymbolAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectSupportedNetworkSymbols],
    (accounts, supportedNetworks): Account[] =>
        sortByCoin(
            accounts.filter(account => isStakingSymbol(account.symbol)),
            supportedNetworks,
        ),
);

export const selectStakingListItems = createMemoizedSelector(
    [selectStakingSymbolAccounts],
    (stakingSymbolAccounts): StakingListItem[] =>
        returnStableArrayIfEmpty(
            createStableArray(
                ...stakingSymbolAccounts.flatMap(account => {
                    const balance = getStakingPositionBalance(account);

                    if (balance === null) return [];

                    return [createStakingListItem(account.symbol, account.key, balance)];
                }),
            ),
        ),
);

export const selectCardanoStakedWithFiveBinariesAccountKey = createMemoizedSelector(
    [selectStakingSymbolAccounts],
    (stakingSymbolAccounts): AccountKey | null =>
        stakingSymbolAccounts.find(isCardanoStakedWithFiveBinaries)?.key ?? null,
);

export const selectStakingListSymbols = createMemoizedSelector(
    [selectStakingListItems],
    (stakingItems): NetworkSymbol[] =>
        returnStableArrayIfEmpty(
            createStableArray(...new Set(stakingItems.map(stakingItem => stakingItem.symbol))),
        ),
);

export const selectYieldClaimAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts],
    (accounts): Account[] =>
        returnStableArrayIfEmpty(
            createStableArray(
                ...accounts.filter(
                    account =>
                        account.networkType === 'ethereum' &&
                        isEarnYieldClaimSupported(account.symbol),
                ),
            ),
        ),
);

const createYieldListItem = weakMapMemoize(
    (
        vault: YieldDtoV2,
        networkSymbol: NetworkSymbol,
        underlyingTokenContract: TokenAddress,
        receiptTokenContract: TokenAddress,
        accountKey: AccountKey,
        contractAddress: TokenAddress,
        tokenBalance: string,
    ): YieldListItem => ({
        id: `${vault.id}-${accountKey}`,
        yieldId: vault.id,
        vaultName: vault.outputToken?.name ?? '',
        tokenSymbol: toTokenSymbol(vault.token.symbol),
        networkSymbol,
        underlyingTokenContract,
        receiptTokenContract,
        contractAddress,
        tokenContractAddress: underlyingTokenContract,
        apy: vault.rewardRate.total ? Number((vault.rewardRate.total * 100).toFixed(2)) : null,
        token: vault.token,
        accountKey,
        tokenBalance,
    }),
);

export const selectYieldListItems = createMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        selectSupportedNetworkSymbols,
        (_state: EarnListRootState, yieldOpportunities: readonly YieldOpportunity[]) =>
            yieldOpportunities,
    ],
    (accounts, supportedNetworks, yieldOpportunities): YieldListItem[] => {
        const itemsWithAccount: YieldListItemWithAccount[] = [];

        for (const vault of yieldOpportunities) {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network || !vault.token.address || !vault.outputToken?.address) continue;

            const underlyingTokenContract = toTokenAddress(vault.token.address);
            const receiptTokenContract = toTokenAddress(vault.outputToken.address);
            const outputTokenAddress = receiptTokenContract.toLowerCase();

            for (const account of accounts) {
                if (
                    account.symbol !== network.symbol ||
                    !hasPositiveContractTokenBalance(account, receiptTokenContract)
                ) {
                    continue;
                }

                const outputToken = account.tokens?.find(
                    token => token.contract.toLowerCase() === outputTokenAddress,
                );

                if (!outputToken) continue;

                itemsWithAccount.push({
                    item: createYieldListItem(
                        vault,
                        network.symbol,
                        underlyingTokenContract,
                        receiptTokenContract,
                        account.key,
                        toTokenAddress(outputToken.contract),
                        getConvertedOutputTokenBalanceToInputTokenAmount({
                            networkSymbol: network.symbol,
                            token: vault.token,
                            outputToken: vault.outputToken,
                            outputTokenBalance: outputToken.balance,
                            pricePerShareState: vault.state?.pricePerShareState,
                        }),
                    ),
                    account,
                });
            }
        }

        const sortedItems = itemsWithAccount
            .toSorted(
                compareEarnByNetworkTokenOrder(
                    ({ item, account }: YieldListItemWithAccount) => ({
                        symbol: item.networkSymbol,
                        tokenSymbol: item.tokenSymbol,
                        accountType: account.accountType,
                        index: account.index,
                    }),
                    supportedNetworks,
                ),
            )
            .map(({ item }) => item);

        return returnStableArrayIfEmpty(createStableArray(...sortedItems));
    },
);

const createYieldPromoListItem = weakMapMemoize(
    (
        vault: YieldDtoV2,
        networkSymbol: NetworkSymbol,
        underlyingTokenContract: TokenAddress,
        receiptTokenContract: TokenAddress | null,
    ): YieldPromoListItem => ({
        id: vault.id,
        yieldId: vault.id,
        vaultName: vault.outputToken?.name ?? '',
        tokenSymbol: toTokenSymbol(vault.token.symbol),
        networkSymbol,
        underlyingTokenContract,
        receiptTokenContract,
        contractAddress: underlyingTokenContract,
        tokenContractAddress: underlyingTokenContract,
        apy: vault.rewardRate.total ? Number((vault.rewardRate.total * 100).toFixed(2)) : null,
        token: vault.token,
        outputToken: vault.outputToken,
        pricePerShareState: vault.state?.pricePerShareState,
    }),
);

export const selectYieldPromoListItems = createMemoizedSelector(
    [
        (_state: EarnListRootState, yieldOpportunities: readonly YieldOpportunity[]) =>
            yieldOpportunities,
    ],
    (yieldOpportunities): YieldPromoListItem[] => {
        const items: YieldPromoListItem[] = [];

        for (const vault of yieldOpportunities) {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network || !vault.token.address) continue;

            items.push(
                createYieldPromoListItem(
                    vault,
                    network.symbol,
                    toTokenAddress(vault.token.address),
                    vault.outputToken?.address ? toTokenAddress(vault.outputToken.address) : null,
                ),
            );
        }

        return returnStableArrayIfEmpty(
            createStableArray(...items.toSorted(compareEarnByApyDesc(item => item.apy))),
        );
    },
);

const createYieldListVaultIcon = weakMapMemoize(
    (
        networkSymbol: NetworkSymbol,
        tokenSymbol: TokenSymbol,
        tokenContractAddress: TokenAddress,
    ): YieldListVaultIcon => ({ networkSymbol, tokenSymbol, tokenContractAddress }),
);

export const selectYieldListVaultIcons = createMemoizedSelector(
    [selectYieldListItems],
    (yieldItems): YieldListVaultIcon[] => {
        const iconsByVault = new Map<string, YieldListVaultIcon>();

        for (const item of yieldItems) {
            const vaultKey = `${item.networkSymbol}:${item.tokenContractAddress.toLowerCase()}`;

            if (iconsByVault.has(vaultKey)) continue;

            iconsByVault.set(
                vaultKey,
                createYieldListVaultIcon(
                    item.networkSymbol,
                    item.tokenSymbol,
                    item.tokenContractAddress,
                ),
            );
        }

        return returnStableArrayIfEmpty(createStableArray(...iconsByVault.values()));
    },
);

const createStableClaimToken = weakMapMemoize(
    (
        networkSymbol: NetworkSymbol,
        contractAddress: TokenAddress,
        symbol: TokenSymbol,
    ): YieldClaimToken => ({ networkSymbol, contractAddress, symbol }),
);

const createStableClaimVault = weakMapMemoize(
    (name: string, tokenContract: TokenAddress): YieldClaimVaultParams => ({
        name,
        tokenContract,
    }),
);

const createStableClaimAccountItem = weakMapMemoize(
    (summary: YieldClaimListItem, vaults: YieldClaimVaultParams[]): YieldClaimAccountItem => ({
        summary,
        vaults,
    }),
);

const buildYieldClaimRewardTokens = (
    networkSymbol: NetworkSymbol,
    claimableRewards: ChainRewardsWithFiat['rewards'],
): YieldClaimRewardToken[] => {
    const tokensByContract = new Map<string, YieldClaimRewardToken>();

    for (const reward of claimableRewards) {
        const contractAddress = toTokenAddress(reward.token.address);
        const tokenKey = contractAddress.toLowerCase();
        const claimableAmount = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(reward.claimable)),
            decimals: reward.token.decimals,
        });
        const previousToken = tokensByContract.get(tokenKey);

        tokensByContract.set(tokenKey, {
            networkSymbol,
            contractAddress,
            symbol: toTokenSymbol(reward.token.symbol),
            decimals: reward.token.decimals,
            claimableAmount: previousToken
                ? new BigNumber(previousToken.claimableAmount).plus(claimableAmount).toString()
                : claimableAmount.toString(),
        });
    }

    return [...tokensByContract.values()];
};

const createYieldClaimListItem = weakMapMemoize(
    (
        accountKey: AccountKey,
        networkSymbol: NetworkSymbol,
        chainRewards: ChainRewardsWithFiat,
    ): YieldClaimListItem | null => {
        const claimableRewards = getClaimableRewards(chainRewards);

        if (claimableRewards.length === 0) return null;

        return {
            accountKey,
            networkSymbol,
            claimableRewardsCount: claimableRewards.length,
            fiatClaimableAmount: getTotalFiatAmountFromClaimableRewards(claimableRewards),
            tokens: buildYieldClaimRewardTokens(networkSymbol, claimableRewards),
        };
    },
);

export const selectYieldClaimListItems = createMemoizedSelector(
    [
        selectYieldClaimAccounts,
        (_state: EarnListRootState, chainsRewardsWithFiat: readonly ChainRewardsWithFiat[]) =>
            chainsRewardsWithFiat,
    ],
    (accounts, chainsRewardsWithFiat): YieldClaimListItem[] => {
        const chainsRewardsByAccountKey = getChainsRewardsByAccountKey(chainsRewardsWithFiat);

        const claimItems = accounts.flatMap(account => {
            const chainRewards = getAccountChainRewards(account, chainsRewardsByAccountKey);

            if (chainRewards === null) return [];

            const claimItem = createYieldClaimListItem(account.key, account.symbol, chainRewards);

            return claimItem === null ? [] : [claimItem];
        });

        return returnStableArrayIfEmpty(createStableArray(...claimItems));
    },
);

export const selectYieldClaimTokens = createMemoizedSelector(
    [selectYieldClaimListItems],
    (claimItems): YieldClaimToken[] => {
        const tokensByContract = new Map<string, YieldClaimToken>();

        for (const claimItem of claimItems) {
            for (const token of claimItem.tokens) {
                const tokenKey = `${token.networkSymbol}:${token.contractAddress.toLowerCase()}`;
                tokensByContract.set(
                    tokenKey,
                    createStableClaimToken(
                        token.networkSymbol,
                        token.contractAddress,
                        token.symbol,
                    ),
                );
            }
        }

        return returnStableArrayIfEmpty(createStableArray(...tokensByContract.values()));
    },
);

export const selectYieldClaimTotalFiatAmount = createMemoizedSelector(
    [selectYieldClaimListItems],
    (claimItems): BaseCurrencyAmount | null => {
        if (claimItems.length === 0) return null;

        const fiatClaimableAmounts = claimItems.flatMap(claimItem =>
            claimItem.fiatClaimableAmount === null ? [] : [claimItem.fiatClaimableAmount],
        );

        if (fiatClaimableAmounts.length !== claimItems.length) return null;

        return sumBaseCurrencyAmounts(fiatClaimableAmounts);
    },
);

export const selectYieldClaimAccountItems = createMemoizedSelector(
    [
        selectYieldClaimListItems,
        (
            state: EarnListRootState,
            _chainsRewardsWithFiat: readonly ChainRewardsWithFiat[],
            yieldOpportunities: readonly YieldOpportunity[],
        ) => selectYieldListItems(state, yieldOpportunities),
    ],
    (claimItems, yieldPositions): YieldClaimAccountItem[] =>
        returnStableArrayIfEmpty(
            createStableArray(
                ...claimItems.map(claimItem =>
                    createStableClaimAccountItem(
                        claimItem,
                        createStableArray(
                            ...yieldPositions.flatMap(position =>
                                position.accountKey === claimItem.accountKey && position.vaultName
                                    ? [
                                          createStableClaimVault(
                                              position.vaultName,
                                              position.tokenContractAddress,
                                          ),
                                      ]
                                    : [],
                            ),
                        ),
                    ),
                ),
            ),
        ),
);

export const selectStakingPromoListSymbols = createMemoizedSelector(
    [selectAreTestnetsEnabled],
    areTestnetsEnabled =>
        (areTestnetsEnabled ? STAKING_SYMBOLS : PROD_STAKING_SYMBOLS).map(asNetworkSymbol),
);

const createStableEarnFiatPosition = weakMapMemoize(
    (
        tickerId: TickerId,
        fiatRateKey: CryptoBaseCurrencyPair,
        balance: string,
    ): EarnFiatPosition => ({
        tickerId,
        fiatRateKey,
        balance,
    }),
);

type CreateEarnFiatPositionParams = {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    balance: string;
    baseCurrency: BaseCurrencyCode;
};

const createEarnFiatPosition = ({
    symbol,
    contractAddress,
    balance,
    baseCurrency,
}: CreateEarnFiatPositionParams): EarnFiatPosition | null => {
    if (new BigNumber(balance).isZero()) return null;

    return createStableEarnFiatPosition(
        createStableTickerId(symbol, contractAddress),
        getFiatRateKey(symbol, baseCurrency, contractAddress),
        balance,
    );
};

const createStableEarnFiatPositions = (positions: (EarnFiatPosition | null)[]) =>
    returnStableArrayIfEmpty(createStableArray(...positions.filter(isNotNull)));

export const selectStakingFiatPositions = createMemoizedSelector(
    [selectStakingListItems, selectBaseCurrency],
    (stakingPositions, baseCurrency): EarnFiatPosition[] =>
        createStableEarnFiatPositions(
            stakingPositions.map(({ symbol, balance }) =>
                createEarnFiatPosition({ symbol, balance, baseCurrency }),
            ),
        ),
);

export const selectYieldFiatPositions = createMemoizedSelector(
    [selectYieldListItems, selectBaseCurrency],
    (yieldPositions, baseCurrency): EarnFiatPosition[] =>
        createStableEarnFiatPositions(
            yieldPositions.map(({ networkSymbol, tokenContractAddress, tokenBalance }) =>
                createEarnFiatPosition({
                    symbol: networkSymbol,
                    contractAddress: toTokenAddress(
                        getContractAddressForNetworkSymbol(networkSymbol, tokenContractAddress),
                    ),
                    balance: tokenBalance,
                    baseCurrency,
                }),
            ),
        ),
);

const getStableEarnFiatRateKeys = (positions: readonly EarnFiatPosition[]) =>
    createStableFiatRateKeys(...new Set(positions.map(({ fiatRateKey }) => fiatRateKey)));

export const selectStakingFiatRateKeys = createMemoizedSelector(
    [selectStakingFiatPositions],
    getStableEarnFiatRateKeys,
);

export const selectYieldFiatRateKeys = createMemoizedSelector(
    [selectYieldFiatPositions],
    getStableEarnFiatRateKeys,
);

export const selectStakingCurrentFiatRates = (state: EarnListRootState) =>
    selectCurrentFiatRatesByFiatRateKeys(state, selectStakingFiatRateKeys(state));

export const selectYieldCurrentFiatRates = (
    state: EarnListRootState,
    yieldOpportunities: readonly YieldOpportunity[],
) =>
    selectCurrentFiatRatesByFiatRateKeys(state, selectYieldFiatRateKeys(state, yieldOpportunities));

const createEarnFiatValuations = (
    positions: readonly EarnFiatPosition[],
    currentFiatRates: RatesByKey | undefined,
): EarnFiatValuation[] =>
    returnStableArrayIfEmpty(
        positions.map(position => ({
            tickerId: position.tickerId,
            fiatAmount: getEarnPositionFiatAmount(position, currentFiatRates),
        })),
    );

export const selectStakingFiatValuations = createMemoizedSelector(
    [selectStakingFiatPositions, selectStakingCurrentFiatRates],
    createEarnFiatValuations,
);

export const selectYieldFiatValuations = createMemoizedSelector(
    [selectYieldFiatPositions, selectYieldCurrentFiatRates],
    createEarnFiatValuations,
);

export const selectEarnFiatValuations = createMemoizedSelector(
    [selectStakingFiatValuations, selectYieldFiatValuations],
    (stakingFiatValuations, yieldFiatValuations): EarnFiatValuation[] =>
        returnStableArrayIfEmpty([...stakingFiatValuations, ...yieldFiatValuations]),
);

export const selectStakingTotalFiatAmount = createMemoizedSelector(
    [selectStakingFiatValuations],
    sumEarnFiatValuations,
);

export const selectYieldTotalFiatAmount = createMemoizedSelector(
    [selectYieldFiatValuations],
    sumEarnFiatValuations,
);

export const selectEarnTotalFiatAmount = createMemoizedSelector(
    [selectEarnFiatValuations],
    sumEarnFiatValuations,
);

export const selectEarnMissingTickerIds = createMemoizedSelector(
    [selectEarnFiatValuations],
    earnFiatValuations => createStableTickerIds(...getEarnMissingRateTickerIds(earnFiatValuations)),
);

export const selectIsEarnFiatTotalIncomplete = createMemoizedSelector(
    [
        selectEarnMissingTickerIds,
        (
            _state: EarnListRootState,
            _yieldOpportunities: readonly YieldOpportunity[],
            isFiatRatesLoading: boolean,
        ) => isFiatRatesLoading,
    ],
    (earnMissingTickerIds, isFiatRatesLoading) =>
        earnMissingTickerIds.length > 0 && !isFiatRatesLoading,
);

export const selectIsEarnFiatTotalUnavailable = createMemoizedSelector(
    [selectIsEarnFiatTotalIncomplete, selectEarnFiatValuations],
    (isEarnFiatTotalIncomplete, earnFiatValuations) =>
        isEarnFiatTotalIncomplete && !hasAnyEarnFiatRate(earnFiatValuations),
);

export const selectIsEarnBalanceBreakdownDisplayed = createMemoizedSelector(
    [
        selectStakingListItems,
        selectYieldListItems,
        selectIsEarnFiatTotalIncomplete,
        selectIsEarnFiatTotalUnavailable,
    ],
    (stakingPositions, yieldPositions, isFiatTotalIncomplete, isFiatTotalUnavailable) =>
        stakingPositions.length > 0 &&
        yieldPositions.length > 0 &&
        !isFiatTotalIncomplete &&
        !isFiatTotalUnavailable,
);
