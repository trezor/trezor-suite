import { useMemo } from 'react';

import { useGetYieldProvider } from '@suite-common/earn-api';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/connect';

import { useAllYieldOpportunities } from 'src/components/earn/EarnDashboard/yield/hooks/useAllYieldOpportunities';
import { useSelector } from 'src/hooks/suite';
import type { AllowanceContextValue } from 'src/hooks/wallet/allowance';

import type { YieldSupplyContextValue } from './useYieldSupplyContext';
import { useYieldSupplyFlow } from '../supply/useYieldSupplyFlow';

type UseYieldSupplyProps = {
    account?: Account;
    allowanceContextValue?: AllowanceContextValue;
    yieldId?: string;
    contractAddress?: string;
};

export const useYieldSupply = ({
    account,
    allowanceContextValue,
    yieldId,
    contractAddress,
}: UseYieldSupplyProps): YieldSupplyContextValue | null => {
    const { yieldOpportunities } = useAllYieldOpportunities();
    const vault = yieldId
        ? yieldOpportunities.find(opportunity => opportunity.id === yieldId)
        : undefined;
    const resolvedContractAddress = contractAddress ?? vault?.token.address;
    const normalizedContractAddress =
        account && resolvedContractAddress
            ? getContractAddressForNetworkSymbol(account.symbol, resolvedContractAddress)
            : undefined;
    const tokenSymbolFromAccount = useMemo(
        () =>
            account?.tokens?.find(
                token =>
                    normalizedContractAddress !== undefined &&
                    token.contract !== undefined &&
                    getContractAddressForNetworkSymbol(account.symbol, token.contract) ===
                        normalizedContractAddress,
            )?.symbol,
        [account, normalizedContractAddress],
    );
    const tokenCryptoId =
        account && normalizedContractAddress
            ? toTokenCryptoId(account.symbol, normalizedContractAddress)
            : undefined;
    const tokenSymbolFromTrading = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, tokenCryptoId),
    );
    const tokenSymbol =
        account &&
        (tokenSymbolFromAccount ??
            tokenSymbolFromTrading ??
            getNetworkDisplaySymbol(account.symbol));
    const matchedToken = useMemo(
        () =>
            account?.tokens?.find((token): token is TokenInfo => {
                const normalizedTokenAddress = token.contract?.toLowerCase();
                const normalizedVaultTokenSymbol = vault?.token.symbol?.toLowerCase();
                const normalizedTokenSymbol = token.symbol?.toLowerCase();

                if (resolvedContractAddress && normalizedTokenAddress) {
                    return normalizedTokenAddress === resolvedContractAddress.toLowerCase();
                }

                if (normalizedVaultTokenSymbol && normalizedTokenSymbol) {
                    return normalizedTokenSymbol === normalizedVaultTokenSymbol;
                }

                return false;
            }),
        [account?.tokens, resolvedContractAddress, vault?.token.symbol],
    );
    const approvalSpender =
        vault?.state?.allocations?.find(allocation => allocation.network === vault.network)
            ?.address ??
        vault?.state?.allocations?.[0]?.address ??
        null;

    const token =
        account &&
        yieldId &&
        vault &&
        tokenSymbol &&
        resolvedContractAddress &&
        matchedToken?.balance !== undefined
            ? {
                  networkSymbol: account.symbol,
                  symbol: tokenSymbol,
                  decimals: matchedToken.decimals ?? vault.token.decimals,
                  contractAddress: resolvedContractAddress,
                  coingeckoId: vault.token.coinGeckoId,
                  providerId: vault.providerId,
                  vaultName: vault.metadata.name,
                  approvalSpender,
                  balance: matchedToken.balance,
              }
            : undefined;

    const supply = useYieldSupplyFlow({
        account,
        allowanceContextValue,
        token,
        yieldId,
    });
    const providerQuery = useGetYieldProvider(token?.providerId ?? '');
    const provider = {
        name: providerQuery.data?.data.name ?? token?.vaultName ?? '',
        companyName: token?.vaultName ?? '',
        logo: providerQuery.data?.data.logoURI ?? '',
        logoSource: 'url' as const,
    };

    if (!account || !yieldId || !vault || !tokenSymbol || !token || !supply) {
        return null;
    }

    return {
        account,
        vault,
        yieldId,
        token,
        provider,
        supply,
    };
};
