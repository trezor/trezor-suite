import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import {
    getConvertedOutputTokenBalanceToInputTokenAmount,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';

import {
    type EarnPromoListDataItem,
    type SkeletonLoaderItem,
    type StablecoinYieldEarnItem,
} from '../types';

const STABLECOIN_SKELETON_ITEMS: SkeletonLoaderItem[] = [
    { type: 'skeleton-loader', id: 'skeleton-0' },
    { type: 'skeleton-loader', id: 'skeleton-1' },
    { type: 'skeleton-loader', id: 'skeleton-2' },
];

type UseStablecoinYieldListDataReturn = {
    activeItems: StablecoinYieldEarnItem[];
    promoListData: EarnPromoListDataItem[];
    isLoading: boolean;
};

export const useStablecoinYieldListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);

    const { yieldOpportunities, isLoading } = useAllYieldOpportunities();

    return useMemo<UseStablecoinYieldListDataReturn>(() => {
        if (isLoading) {
            const promoListData: EarnPromoListDataItem[] = [
                'stablecoin-yield',
                ...STABLECOIN_SKELETON_ITEMS,
            ];

            return { activeItems: [], promoListData, isLoading };
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

            const tokenContractAddress = toTokenAddress(vault.token.address);
            const outputTokenAddress = vault.outputToken?.address?.toLowerCase();

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
                vaultName: vault.outputToken?.name ?? '',
                tokenSymbol: stablecoinSymbol,
                networkSymbol: network.symbol,
                contractAddress: tokenContractAddress,
                tokenContractAddress,
                accountKey: null,
                accountLabel: undefined,
                tokenBalance: null,
                apy,
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

        const promoListData: EarnPromoListDataItem[] = ['stablecoin-yield', ...promoItems];

        return { activeItems, promoListData, isLoading };
    }, [accounts, yieldOpportunities, isLoading]);
};
