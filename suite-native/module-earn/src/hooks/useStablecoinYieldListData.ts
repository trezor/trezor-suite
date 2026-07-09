import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import {
    getConvertedOutputTokenBalanceToInputTokenAmount,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import {
    compareEarnByAmountDesc,
    compareEarnByApyDesc,
    compareEarnByNetwork,
} from '@suite-common/wallet-utils';

import {
    type EarnPromoListDataItem,
    type EarnProviderListItem,
    type SkeletonLoaderItem,
    type StablecoinYieldEarnItem,
    type StablecoinYieldLoadErrorListItem,
} from '../types';
import {
    type StablecoinYieldClaimSummariesState,
    useStablecoinYieldClaimSummaries,
} from './useStablecoinYieldClaimSummaries';

export const MORPHO_PROVIDER_LIST_ITEM = {
    id: 'morpho-provider',
    type: 'provider',
    provider: 'morpho',
} as const satisfies EarnProviderListItem;

const STABLECOIN_SKELETON_ITEMS: SkeletonLoaderItem[] = [
    { type: 'skeleton-loader', id: 'skeleton-0' },
    { type: 'skeleton-loader', id: 'skeleton-1' },
    { type: 'skeleton-loader', id: 'skeleton-2' },
];

const DEFAULT_STABLECOIN_YIELD_PROMO_LIST_DATA: EarnPromoListDataItem[] = ['stablecoin-yield'];

export const STABLECOIN_YIELD_LOAD_ERROR_ITEM = {
    id: 'stablecoin-yield-load-error',
    type: 'stablecoin-yield-load-error',
} as const satisfies StablecoinYieldLoadErrorListItem;

type UseStablecoinYieldListDataReturn = {
    activeItems: StablecoinYieldEarnItem[];
    promoListData: EarnPromoListDataItem[];
    isLoading: boolean;
    isError: boolean;
    retryLoadStablecoinYield: () => void;
} & StablecoinYieldClaimSummariesState;

export const useStablecoinYieldListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);

    const { data: yieldOpportunities, isLoading, isError, refetch } = useAllYieldOpportunities();

    const retryLoadStablecoinYield = useCallback(() => {
        void refetch();
    }, [refetch]);

    const listData = useMemo(() => {
        if (isLoading) {
            const promoListData: EarnPromoListDataItem[] = [
                ...DEFAULT_STABLECOIN_YIELD_PROMO_LIST_DATA,
                ...STABLECOIN_SKELETON_ITEMS,
            ];

            return { activeItems: [], promoListData, isLoading, isError };
        }

        if (isError || !yieldOpportunities) {
            const promoListData: EarnPromoListDataItem[] = [
                ...DEFAULT_STABLECOIN_YIELD_PROMO_LIST_DATA,
                STABLECOIN_YIELD_LOAD_ERROR_ITEM,
            ];

            return { activeItems: [], promoListData, isLoading, isError: true };
        }

        const activeItems: StablecoinYieldEarnItem[] = [];
        const promoItems: StablecoinYieldEarnItem[] = [];

        for (const vault of yieldOpportunities) {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network) {
                continue;
            }

            if (!vault.token.address) {
                continue;
            }

            const stablecoinSymbol = toTokenSymbol(vault.token.symbol.toUpperCase());

            const apy = vault.rewardRate.total
                ? Number((vault.rewardRate.total * 100).toFixed(2))
                : null;

            const underlyingTokenContract = toTokenAddress(vault.token.address);
            const receiptTokenContract = vault.outputToken?.address
                ? toTokenAddress(vault.outputToken.address)
                : null;
            const outputTokenAddress = receiptTokenContract?.toLowerCase();

            const accountsWithPosition = outputTokenAddress
                ? accounts.filter(account => {
                      if (account.symbol !== network.symbol) {
                          return false;
                      }

                      return account.tokens?.some(
                          token => token.contract.toLowerCase() === outputTokenAddress,
                      );
                  })
                : [];

            const defaultYieldItem: StablecoinYieldEarnItem = {
                id: vault.id,
                type: 'stablecoin-yield',
                yieldId: vault.id,
                vaultName: vault.outputToken?.name ?? '',
                tokenSymbol: stablecoinSymbol,
                networkSymbol: network.symbol,
                underlyingTokenContract,
                receiptTokenContract,
                contractAddress: underlyingTokenContract,
                tokenContractAddress: underlyingTokenContract,
                accountKey: null,
                accountLabel: undefined,
                tokenBalance: null,
                apy,
                token: vault.token,
                outputToken: vault.outputToken,
                pricePerShareState: vault.state?.pricePerShareState,
            };

            promoItems.push(defaultYieldItem);

            if (outputTokenAddress && accountsWithPosition.length > 0) {
                for (const account of accountsWithPosition) {
                    const outputToken = account.tokens?.find(
                        token => token.contract.toLowerCase() === outputTokenAddress,
                    );

                    if (!outputToken) {
                        continue;
                    }

                    activeItems.push({
                        ...defaultYieldItem,
                        id: `${vault.id}-${account.key}`,
                        contractAddress: toTokenAddress(outputToken.contract),
                        accountKey: account.key,
                        accountLabel: account.accountLabel,
                        tokenBalance: getConvertedOutputTokenBalanceToInputTokenAmount({
                            networkSymbol: network.symbol,
                            token: vault.token,
                            outputToken: vault.outputToken,
                            outputTokenBalance: outputToken.balance,
                            pricePerShareState: vault.state?.pricePerShareState,
                        }),
                    });
                }
            }
        }

        // Opportunities the user has no position in are ordered by APY (highest first); items
        // without an APY are pushed to the end.
        const sortedPromoItems = [...promoItems].sort(compareEarnByApyDesc(item => item.apy));

        // Active positions are grouped by network (canonical coin order), highest balance first.
        const sortedActiveItems = [...activeItems]
            .sort(compareEarnByAmountDesc(item => item.tokenBalance ?? '0'))
            .sort(compareEarnByNetwork(item => item.networkSymbol));

        const promoListData: EarnPromoListDataItem[] = [
            ...DEFAULT_STABLECOIN_YIELD_PROMO_LIST_DATA,
            ...sortedPromoItems,
            ...(sortedPromoItems.length > 0 ? [MORPHO_PROVIDER_LIST_ITEM] : []),
        ];

        return { activeItems: sortedActiveItems, promoListData, isLoading, isError };
    }, [accounts, yieldOpportunities, isLoading, isError]);

    const stablecoinYieldClaimSummariesState = useStablecoinYieldClaimSummaries({
        activeItems: listData.activeItems,
        accounts,
    });

    return useMemo<UseStablecoinYieldListDataReturn>(
        () => ({
            ...listData,
            ...stablecoinYieldClaimSummariesState,
            retryLoadStablecoinYield,
            isClaimSummariesLoading:
                listData.isLoading || stablecoinYieldClaimSummariesState.isClaimSummariesLoading,
        }),
        [listData, retryLoadStablecoinYield, stablecoinYieldClaimSummariesState],
    );
};
