import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-api';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { SUPPORTED_STABLECOINS } from '@suite-common/wallet-constants';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import { StablecoinYieldEarnItem } from '../types';
import { useStablecoinYieldFlag } from './useStablecoinYieldFlag';

export const useStablecoinYieldListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isDebugEnabled = useStablecoinYieldFlag();

    const { yieldOpportunities } = useAllYieldOpportunities();

    return useMemo(() => {
        if (!isDebugEnabled) {
            return { listData: [] };
        }
        const yieldItems: StablecoinYieldEarnItem[] = [];

        SUPPORTED_STABLECOINS.forEach(({ symbol: stablecoinSymbol, networks }) => {
            networks.forEach(yieldNetwork => {
                const vault = yieldOpportunities.find(
                    v =>
                        v.token.symbol.toUpperCase() === stablecoinSymbol &&
                        v.network === yieldNetwork,
                );

                if (!vault) {
                    return;
                }

                const network = getNetworkByYieldXyzId(yieldNetwork);

                if (!network) {
                    return;
                }

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

                if (accountsWithToken.length > 0) {
                    accountsWithToken.forEach(account => {
                        const token = account.tokens?.find(t => {
                            if (vaultTokenAddress && t.contract) {
                                return t.contract.toLowerCase() === vaultTokenAddress;
                            }

                            return t.symbol?.toUpperCase() === stablecoinSymbol;
                        });

                        yieldItems.push({
                            ...defaultYieldItem,
                            contractAddress: (token?.contract ||
                                vault.token.address ||
                                '') as TokenAddress,
                            accountKey: account.key,
                            accountLabel: account.accountLabel,
                            tokenBalance: token?.balance ?? null,
                        });
                    });
                } else {
                    yieldItems.push(defaultYieldItem);
                }
            });
        });

        const listData = yieldItems.length > 0 ? ['Stablecoin yield', ...yieldItems] : [];

        return { listData };
    }, [accounts, yieldOpportunities, isDebugEnabled]);
};
