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
} from '@suite-common/wallet-core';
import type { Account, TokenInfoBranded } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { getApyPercent } from 'src/components/earn/utils/earnApyUtils';

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

const getConvertedOutputTokenBalanceToInputTokenAmount = ({
    account,
    vault,
    matchedOutputToken,
}: {
    account: Account;
    vault: YieldDto;
    matchedOutputToken: TokenInfoBranded | undefined;
}) => {
    if (!matchedOutputToken) {
        return '0';
    }

    if (
        doTokensMatch({
            networkSymbol: account.symbol,
            firstToken: vault.outputToken,
            secondToken: vault.token,
        })
    ) {
        return matchedOutputToken.balance ?? '0';
    }

    const pricePerShareState = vault.state?.pricePerShareState;

    if (
        !pricePerShareState ||
        !doTokensMatch({
            networkSymbol: account.symbol,
            firstToken: pricePerShareState.shareToken,
            secondToken: vault.outputToken,
        }) ||
        !doTokensMatch({
            networkSymbol: account.symbol,
            firstToken: pricePerShareState.quoteToken,
            secondToken: vault.token,
        })
    ) {
        return '0';
    }

    return new BigNumber(matchedOutputToken.balance ?? '0')
        .times(pricePerShareState.price)
        .decimalPlaces(vault.token.decimals, BigNumber.ROUND_DOWN)
        .toString();
};

type UseResolvedYieldFlowDataResult = {
    account: Account;
    vault: YieldDto | null;
    token: YieldFlowToken | null;
    receiptToken: YieldFlowDisplayToken | null;
    apy: number | null;
    suppliedAmount: string;
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
              account,
              vault,
              matchedOutputToken,
          })
        : '0';

    const flowKey = `${account.key}:${routeParams.yieldId}:${resolvedContractAddress ?? ''}`;

    const apy = vault?.rewardRate?.total != null ? getApyPercent(vault.rewardRate.total) : null;

    return {
        account,
        vault: vault ?? null,
        token,
        receiptToken,
        apy,
        suppliedAmount,
        flowKey,
    };
};
