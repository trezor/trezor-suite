import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { BalanceType, getAggregateBalances, useGetYieldProvider } from '@suite-common/earn-api';
import { useQuery } from '@suite-common/react-query';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { useAllYieldOpportunities } from 'src/components/earn/EarnDashboard/yield/hooks/useAllYieldOpportunities';
import { useSelector } from 'src/hooks/suite';
import type { AllowanceContextValue } from 'src/hooks/wallet/allowance';

import type { YieldWithdrawContextValue } from './useYieldWithdrawContext';
import { useYieldWithdrawFlow } from '../withdraw/useYieldWithdrawFlow';

type UseYieldWithdrawProps = {
    account?: Account;
    allowanceContextValue?: AllowanceContextValue;
    yieldId?: string;
    contractAddress?: string;
};

export const useYieldWithdraw = ({
    account,
    allowanceContextValue,
    yieldId,
    contractAddress,
}: UseYieldWithdrawProps): YieldWithdrawContextValue | null => {
    const { translationString } = useTranslation();
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
        account && yieldId && vault && tokenSymbol && resolvedContractAddress
            ? {
                  networkSymbol: account.symbol,
                  symbol: tokenSymbol,
                  decimals: matchedToken?.decimals ?? vault.token.decimals,
                  contractAddress: resolvedContractAddress,
                  coingeckoId: vault.token.coinGeckoId,
                  providerId: vault.providerId,
                  vaultName: vault.metadata.name,
                  approvalSpender,
              }
            : undefined;
    const providerQuery = useGetYieldProvider(token?.providerId ?? '');
    const provider = {
        name: providerQuery.data?.data.name ?? token?.vaultName ?? '',
        companyName: token?.vaultName ?? '',
        logo: providerQuery.data?.data.logoURI ?? '',
        logoSource: 'url' as const,
    };
    const suppliedAmountQuery = useQuery({
        queryKey: ['yield-supplied-balance', yieldId, account?.descriptor, vault?.network],
        queryFn: async () => {
            if (!yieldId || !account?.descriptor || !vault?.network) {
                return [];
            }

            const response = await getAggregateBalances({
                queries: [
                    {
                        yieldId,
                        address: account.descriptor,
                        network: vault.network,
                    },
                ],
            });

            return response.data.items;
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!yieldId && !!account?.descriptor && !!vault?.network,
    });
    const suppliedAmount = useMemo(() => {
        const balanceItem = suppliedAmountQuery.data?.at(0);

        if (!balanceItem || !account?.descriptor) {
            return null;
        }

        return balanceItem.balances
            .filter(balance => balance.address.toLowerCase() === account.descriptor.toLowerCase())
            .filter(
                balance =>
                    balance.type === BalanceType.active || balance.type === BalanceType.entering,
            )
            .reduce((sum, balance) => sum.plus(balance.amount), new BigNumber(0))
            .toString();
    }, [suppliedAmountQuery.data, account?.descriptor]);
    const resolvedSuppliedAmount = suppliedAmount ?? '0';
    const receiptToken = token
        ? {
              networkSymbol: token.networkSymbol,
              symbol:
                  vault?.outputToken?.symbol ?? translationString('TR_EARN_YIELD_RECEIPT_TOKEN'),
              decimals: vault?.outputToken?.decimals ?? token.decimals,
              contractAddress: vault?.outputToken?.address,
              coingeckoId: vault?.outputToken?.coinGeckoId,
          }
        : undefined;
    const withdraw = useYieldWithdrawFlow({
        account,
        allowanceContextValue,
        token,
        receiptToken,
        suppliedAmount,
        yieldId,
    });

    if (!account || !yieldId || !vault || !tokenSymbol || !token || !receiptToken || !withdraw) {
        return null;
    }

    return {
        account,
        vault,
        yieldId,
        token,
        receiptToken,
        provider,
        suppliedAmount: resolvedSuppliedAmount,
        withdraw,
    };
};
