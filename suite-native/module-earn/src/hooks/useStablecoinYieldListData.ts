import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import {
    type EarnPromoListDataItem,
    type SkeletonLoaderItem,
    type StablecoinYieldEarnItem,
} from '../types';
import { useStablecoinYieldFlag } from './useStablecoinYieldFlag';

const STABLECOIN_SKELETON_ITEMS: SkeletonLoaderItem[] = [
    { type: 'skeleton-loader', id: 'skeleton-0' },
    { type: 'skeleton-loader', id: 'skeleton-1' },
    { type: 'skeleton-loader', id: 'skeleton-2' },
];

type UseStablecoinYieldListDataReturn = {
    activeItems: StablecoinYieldEarnItem[];
    promoListData: EarnPromoListDataItem[];
};

export const useStablecoinYieldListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isDebugEnabled = useStablecoinYieldFlag();

    const { yieldOpportunities, isLoading } = useAllYieldOpportunities({
        enabled: isDebugEnabled,
    });

    return useMemo<UseStablecoinYieldListDataReturn>(() => {
        if (!isDebugEnabled) {
            return { activeItems: [], promoListData: [] };
        }

        if (isLoading) {
            const promoListData: EarnPromoListDataItem[] = [
                'stablecoin-yield',
                ...STABLECOIN_SKELETON_ITEMS,
            ];

            return { activeItems: [], promoListData };
        }

        const activeItems: StablecoinYieldEarnItem[] = [];
        const promoItems: StablecoinYieldEarnItem[] = [];

        for (const vault of yieldOpportunities) {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network) {
                continue;
            }

            const stablecoinSymbol = vault.token.symbol.toUpperCase();

            const apy = vault.rewardRate.total
                ? Number((vault.rewardRate.total * 100).toFixed(2))
                : null;

            const vaultTokenAddress = vault.token.address?.toLowerCase();

            const accountsWithToken = accounts.filter(account => {
                if (account.symbol !== network.symbol) {
                    return false;
                }

                return account.tokens?.some(token => {
                    if (vaultTokenAddress && token.contract) {
                        return token.contract.toLowerCase() === vaultTokenAddress;
                    }

                    return token.symbol?.toUpperCase() === stablecoinSymbol;
                });
            });

            const defaultYieldItem: StablecoinYieldEarnItem = {
                id: vault.id,
                type: 'stablecoin-yield',
                vaultName: vault.outputToken?.name || '',
                tokenSymbol: stablecoinSymbol as TokenSymbol,
                networkSymbol: network.symbol,
                contractAddress: (vault.token.address || '') as TokenAddress,
                accountKey: null,
                accountLabel: undefined,
                tokenBalance: null,
                apy,
            };

            promoItems.push(defaultYieldItem);

            if (accountsWithToken.length > 0) {
                for (const account of accountsWithToken) {
                    const token = account.tokens?.find(t => {
                        if (vaultTokenAddress && t.contract) {
                            return t.contract.toLowerCase() === vaultTokenAddress;
                        }

                        return t.symbol?.toUpperCase() === stablecoinSymbol;
                    });

                    activeItems.push({
                        ...defaultYieldItem,
                        id: `${vault.id}-${account.key}`,
                        contractAddress: (token?.contract ||
                            vault.token.address ||
                            '') as TokenAddress,
                        accountKey: account.key,
                        accountLabel: account.accountLabel,
                        tokenBalance: token?.balance ?? null,
                    });
                }
            }
        }

        const promoListData: EarnPromoListDataItem[] = ['stablecoin-yield', ...promoItems];

        return { activeItems, promoListData };
    }, [accounts, yieldOpportunities, isDebugEnabled, isLoading]);
};
