import { useEffect, useMemo } from 'react';

import { goto } from '@suite/router';
import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/connect';

import { getApyPercent } from 'src/components/earn/utils/earnApyUtils';
import { useDispatch } from 'src/hooks/suite';

import { useEarnRouteAccount } from '../../utils/useEarnRouteAccount';
import type { YieldFlowDisplayToken, YieldFlowToken } from '../common/types';

type UseResolvedYieldFlowDataResult = {
    token: YieldFlowToken | null;
    receiptToken: YieldFlowDisplayToken | null;
    apy: number | null;
    flowKey?: string;
};

export const useResolvedYieldFlowData = (): UseResolvedYieldFlowDataResult => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const { yieldOpportunities } = useAllYieldOpportunities();

    const vault = yieldOpportunities.find(opportunity => opportunity.id === routeParams?.yieldId);
    const resolvedContractAddress = routeParams?.contractAddress ?? vault?.token.address;

    const matchedToken = useMemo(
        () =>
            account?.tokens?.find((token): token is TokenInfo => {
                const normalizedTokenAddress =
                    token.contract &&
                    getContractAddressForNetworkSymbol(account.symbol, token.contract);
                const normalizedRouteAddress =
                    resolvedContractAddress &&
                    getContractAddressForNetworkSymbol(account.symbol, resolvedContractAddress);
                const normalizedVaultTokenSymbol = vault?.token.symbol?.toLowerCase();
                const normalizedTokenSymbol = token.symbol?.toLowerCase();

                if (normalizedTokenAddress && normalizedRouteAddress) {
                    return normalizedTokenAddress === normalizedRouteAddress;
                }

                if (normalizedVaultTokenSymbol && normalizedTokenSymbol) {
                    return normalizedTokenSymbol === normalizedVaultTokenSymbol;
                }

                return false;
            }),
        [account, resolvedContractAddress, vault?.token.symbol],
    );

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    const token = useMemo<YieldFlowToken | null>(() => {
        if (!account || !vault) {
            return null;
        }

        return {
            networkSymbol: account.symbol,
            symbol:
                matchedToken?.symbol ??
                vault.token.symbol ??
                getNetworkDisplaySymbol(account.symbol),
            decimals: matchedToken?.decimals ?? vault.token.decimals,
            contractAddress: resolvedContractAddress ?? null,
            coingeckoId: vault.token.coinGeckoId,
            balance: matchedToken?.balance ?? '0',
        };
    }, [account, matchedToken, resolvedContractAddress, vault]);

    const receiptToken = useMemo<YieldFlowDisplayToken | null>(() => {
        if (!account || !vault || !token) {
            return null;
        }

        return {
            networkSymbol: account.symbol,
            symbol: vault.outputToken?.symbol ?? token.symbol,
            decimals: vault.outputToken?.decimals ?? token.decimals,
            contractAddress: vault.outputToken?.address ?? null,
            coingeckoId: vault.outputToken?.coinGeckoId,
        };
    }, [account, token, vault]);

    const flowKey = routeParams
        ? `${account?.key ?? ''}:${routeParams.yieldId}:${resolvedContractAddress ?? ''}`
        : undefined;

    const apy = vault?.rewardRate?.total != null ? getApyPercent(vault.rewardRate.total) : null;

    return {
        token,
        receiptToken,
        apy,
        flowKey,
    };
};
