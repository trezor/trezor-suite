import { type DeviceRootState } from '@suite-common/device';
import {
    type ChainRewardsWithFiat,
    type MerklRewardsParams,
    type YieldDtoV2,
} from '@suite-common/earn-stablecoin-api';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkByYieldXyzId,
    isEarnYieldClaimSupported,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    isCardanoStakedWithFiveBinaries,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyAmount,
    type TokenAddress,
    type TokenSymbol,
    asBaseCurrencyAmount,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    compareEarnByNetworkTokenOrder,
    getAccountTotalStakingBalance,
    isStakingSymbol,
    sortByCoin,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { type YieldClaimVaultParams } from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import {
    type StakingListItem,
    type YieldClaimAccountItem,
    type YieldClaimListItem,
    type YieldClaimRewardToken,
    type YieldClaimToken,
    type YieldListItem,
    type YieldListItemWithAccount,
    type YieldListVaultIcon,
} from './types';
import { hasPositiveContractTokenBalance } from './utils/earn/contractTokenBalanceUtils';
import { hasAccountActiveStaking } from './utils/staking/hasAccountActiveStaking';

export type EarnListRootState = AccountsRootState & DeviceRootState & NetworksRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<EarnListRootState>();

const createStableArray = weakMapMemoize(<T>(...items: T[]) => items);

const createStableBaseCurrencyAmount = weakMapMemoize((value: string) =>
    asBaseCurrencyAmount(new BigNumber(value)),
);

const createStakingListItem = weakMapMemoize(
    (symbol: NetworkSymbol, accountKey: AccountKey, balance: string): StakingListItem => ({
        symbol,
        accountKey,
        balance,
    }),
);

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
                ...stakingSymbolAccounts
                    .filter(hasAccountActiveStaking)
                    .map(account =>
                        createStakingListItem(
                            account.symbol,
                            account.key,
                            getAccountTotalStakingBalance(account) ?? '0',
                        ),
                    ),
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
        outputToken: vault.outputToken,
        pricePerShareState: vault.state?.pricePerShareState,
        accountKey,
        tokenBalance,
    }),
);

export const selectYieldListItems = createMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        selectSupportedNetworkSymbols,
        (_state: EarnListRootState, yieldOpportunities: readonly YieldDtoV2[]) =>
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

const createStableClaimRewardToken = weakMapMemoize(
    (
        networkSymbol: NetworkSymbol,
        contractAddress: TokenAddress,
        symbol: TokenSymbol,
        decimals: number,
        claimableAmount: string,
    ): YieldClaimRewardToken => ({
        networkSymbol,
        contractAddress,
        symbol,
        decimals,
        claimableAmount,
    }),
);

const createStableClaimListItem = weakMapMemoize(
    (
        accountKey: AccountKey,
        networkSymbol: NetworkSymbol,
        claimableRewardsCount: number,
        fiatClaimableAmount: BaseCurrencyAmount | null,
        tokens: YieldClaimRewardToken[],
    ): YieldClaimListItem => ({
        accountKey,
        networkSymbol,
        claimableRewardsCount,
        fiatClaimableAmount,
        tokens,
    }),
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

const getChainAddressKey = ({ chainId, address }: MerklRewardsParams<string>) =>
    `${chainId}:${address.toLowerCase()}`;

const getAccountChainAddressKey = (account: Account): string | null => {
    if (account.networkType !== 'ethereum') return null;

    const network = getNetwork(account.symbol);

    if (!network?.chainId) return null;

    return getChainAddressKey({ chainId: network.chainId, address: account.descriptor });
};

const getChainsRewardsByAccountKey = (chainsRewardsWithFiat: readonly ChainRewardsWithFiat[]) =>
    new Map(
        chainsRewardsWithFiat.map(chainRewards => [
            getChainAddressKey({ chainId: chainRewards.chainId, address: chainRewards.address }),
            chainRewards,
        ]),
    );

const sumStableBaseCurrencyAmounts = (amounts: BaseCurrencyAmount[]) =>
    createStableBaseCurrencyAmount(
        amounts.reduce((total, amount) => total.plus(amount), new BigNumber(0)).toFixed(),
    );

const getTotalFiatAmountFromClaimableRewards = (
    claimableRewards: ChainRewardsWithFiat['rewards'],
): BaseCurrencyAmount | null => {
    const fiatClaimableAmounts = claimableRewards.flatMap(reward =>
        reward.fiat.claimable === null ? [] : [reward.fiat.claimable],
    );

    if (fiatClaimableAmounts.length !== claimableRewards.length) return null;

    return sumStableBaseCurrencyAmounts(fiatClaimableAmounts);
};

const getAccountClaimableRewards = (
    account: Account,
    chainsRewardsByAccountKey: Map<string, ChainRewardsWithFiat>,
): ChainRewardsWithFiat['rewards'] => {
    const accountChainAddressKey = getAccountChainAddressKey(account);

    if (accountChainAddressKey === null) return [];

    const chainRewards = chainsRewardsByAccountKey.get(accountChainAddressKey);

    if (!chainRewards) return [];

    return chainRewards.rewards.filter(reward => new BigNumber(reward.claimable).gt(0));
};

const buildClaimRewardTokens = (
    account: Account,
    claimableRewards: ChainRewardsWithFiat['rewards'],
): YieldClaimRewardToken[] => {
    const tokensByContract = new Map<string, YieldClaimRewardToken>();

    for (const reward of claimableRewards) {
        const contractAddress = toTokenAddress(reward.token.address);
        const tokenKey = `${account.symbol}:${contractAddress.toLowerCase()}`;
        const claimableAmount = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(reward.claimable)),
            decimals: reward.token.decimals,
        });
        const previousToken = tokensByContract.get(tokenKey);

        tokensByContract.set(
            tokenKey,
            createStableClaimRewardToken(
                account.symbol,
                contractAddress,
                toTokenSymbol(reward.token.symbol),
                reward.token.decimals,
                previousToken
                    ? new BigNumber(previousToken.claimableAmount).plus(claimableAmount).toString()
                    : claimableAmount.toString(),
            ),
        );
    }

    return createStableArray(...tokensByContract.values());
};

const selectChainsRewardsWithFiat = (
    _state: EarnListRootState,
    chainsRewardsWithFiat: readonly ChainRewardsWithFiat[],
) => chainsRewardsWithFiat;

export const selectYieldClaimListItems = createMemoizedSelector(
    [selectYieldClaimAccounts, selectChainsRewardsWithFiat],
    (accounts, chainsRewardsWithFiat): YieldClaimListItem[] => {
        const chainsRewardsByAccountKey = getChainsRewardsByAccountKey(chainsRewardsWithFiat);

        const claimItems = accounts.flatMap(account => {
            const claimableRewards = getAccountClaimableRewards(account, chainsRewardsByAccountKey);

            if (claimableRewards.length === 0) return [];

            return [
                createStableClaimListItem(
                    account.key,
                    account.symbol,
                    claimableRewards.length,
                    getTotalFiatAmountFromClaimableRewards(claimableRewards),
                    buildClaimRewardTokens(account, claimableRewards),
                ),
            ];
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

        return sumStableBaseCurrencyAmounts(fiatClaimableAmounts);
    },
);

export const selectYieldClaimAccountItems = createMemoizedSelector(
    [
        selectYieldClaimListItems,
        (
            state: EarnListRootState,
            _chainsRewardsWithFiat: readonly ChainRewardsWithFiat[],
            yieldOpportunities: readonly YieldDtoV2[],
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
