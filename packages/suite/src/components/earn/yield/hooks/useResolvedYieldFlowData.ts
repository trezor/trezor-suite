import { useMemo } from 'react';

import { type EarnParams } from '@suite/router';
import {
    type TokenDto,
    type YieldDto,
    useAllYieldOpportunities,
} from '@suite-common/earn-stablecoin-api';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    type YieldFlowToken,
    doTokensMatch,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getStablecoinYieldFlowKey,
} from '@suite-common/wallet-core';
import type { Account, TokenInfoBranded } from '@suite-common/wallet-types';
import { getApyPercent, getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/connect';

const hasTokenSymbol = (
    accountToken: NonNullable<Account['tokens']>[number],
): accountToken is TokenInfoBranded => accountToken.symbol !== undefined;

const getMatchedAccountToken = ({
    account,
    token,
}: {
    account: Account;
    token?: Pick<TokenDto, 'address' | 'symbol' | 'decimals'>;
}) => {
    if (!account.tokens?.length || !token) {
        return undefined;
    }

    return account.tokens.find(
        (accountToken): accountToken is TokenInfoBranded =>
            hasTokenSymbol(accountToken) &&
            doTokensMatch({
                networkSymbol: account.symbol,
                firstToken: {
                    address: accountToken.contract,
                    symbol: accountToken.symbol,
                    decimals: accountToken.decimals,
                },
                secondToken: token,
            }),
    );
};

type UseResolvedYieldFlowDataResult = {
    account: Account;
    vault: YieldDto | null;
    token: YieldFlowToken | null;
    receiptToken: YieldFlowDisplayToken | null;
    apy: number | null;
    suppliedAmount: string;
    suppliedSharesAmount: string;
    flowKey: string;
};

type UseResolvedYieldFlowDataProps = {
    account: Account;
    routeParams: EarnParams;
};

export const useResolvedYieldFlowData = ({
    account,
    routeParams,
}: UseResolvedYieldFlowDataProps): UseResolvedYieldFlowDataResult => {
    const { yieldOpportunities } = useAllYieldOpportunities();

    const vault = yieldOpportunities.find(opportunity => opportunity.id === routeParams.yieldId);
    const resolvedContractAddress = routeParams.contractAddress ?? vault?.token.address;

    const matchedToken = useMemo(() => {
        if (resolvedContractAddress) {
            return account.tokens?.find((token): token is TokenInfo => {
                const normalizedTokenAddress =
                    token.contract &&
                    getContractAddressForNetworkSymbol(account.symbol, token.contract);
                const normalizedRouteAddress = getContractAddressForNetworkSymbol(
                    account.symbol,
                    resolvedContractAddress,
                );

                return normalizedTokenAddress === normalizedRouteAddress;
            });
        }

        return getMatchedAccountToken({
            account,
            token: vault?.token,
        });
    }, [account, resolvedContractAddress, vault?.token]);

    const matchedOutputToken = useMemo(
        () =>
            vault
                ? getMatchedAccountToken({
                      account,
                      token: vault.outputToken,
                  })
                : undefined,
        [account, vault],
    );

    const token = useMemo<YieldFlowToken | null>(() => {
        if (!vault) {
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
        if (!vault || !token) {
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

    const suppliedAmount = vault
        ? getConvertedOutputTokenBalanceToInputTokenAmount({
              networkSymbol: account.symbol,
              token: vault.token,
              outputToken: vault.outputToken,
              outputTokenBalance: matchedOutputToken?.balance,
              pricePerShareState: vault.state?.pricePerShareState,
          })
        : '0';

    const suppliedSharesAmount = matchedOutputToken?.balance ?? '0';

    const flowKey = getStablecoinYieldFlowKey({
        accountKey: account.key,
        tokenContract: resolvedContractAddress,
        yieldId: routeParams.yieldId,
    });

    const apy = vault?.rewardRate?.total != null ? getApyPercent(vault.rewardRate.total) : null;

    return {
        account,
        vault: vault ?? null,
        token,
        receiptToken,
        apy,
        suppliedAmount,
        suppliedSharesAmount,
        flowKey,
    };
};
