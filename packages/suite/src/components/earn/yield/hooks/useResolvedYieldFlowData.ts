import { useMemo } from 'react';

import { type TokenDtoV2, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    type YieldFlowToken,
    doTokensMatch,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getStablecoinYieldFlowKey,
    selectBaseCurrency,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import { type Account, type TokenInfoBranded, toTokenAddress } from '@suite-common/wallet-types';
import { getApyPercent, getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

const hasTokenSymbol = (
    accountToken: NonNullable<Account['tokens']>[number],
): accountToken is TokenInfoBranded => accountToken.symbol !== undefined;

const getMatchedAccountToken = ({
    account,
    token,
}: {
    account: Account;
    token?: Pick<TokenDtoV2, 'address' | 'symbol' | 'decimals'>;
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
    token: YieldFlowToken | null;
    receiptToken: YieldFlowDisplayToken | null;
    apy: number | null;
    depositedAmount: string;
    depositedSharesAmount: string;
    flowKey: string;
};

type UseResolvedYieldFlowDataProps = {
    account: Account;
    vault: YieldDtoV2;
};

export const useResolvedYieldFlowData = ({
    account,
    vault,
}: UseResolvedYieldFlowDataProps): UseResolvedYieldFlowDataResult => {
    const resolvedContractAddress = vault.token.address;

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
            token: vault.token,
        });
    }, [account, resolvedContractAddress, vault.token]);

    const matchedOutputToken = useMemo(
        () =>
            getMatchedAccountToken({
                account,
                token: vault.outputToken,
            }),
        [account, vault],
    );

    const token = useMemo<YieldFlowToken | null>(
        () => ({
            networkSymbol: account.symbol,
            symbol:
                matchedToken?.symbol ??
                vault.token.symbol ??
                getNetworkDisplaySymbol(account.symbol),
            decimals: matchedToken?.decimals ?? vault.token.decimals,
            contractAddress: resolvedContractAddress ?? null,
            coingeckoId: vault.token.coinGeckoId,
            balance: matchedToken?.balance ?? '0',
        }),
        [account, matchedToken, resolvedContractAddress, vault],
    );

    const receiptToken = useMemo<YieldFlowDisplayToken | null>(() => {
        if (!token) {
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

    const depositedAmount = getConvertedOutputTokenBalanceToInputTokenAmount({
        networkSymbol: account.symbol,
        token: vault.token,
        outputToken: vault.outputToken,
        outputTokenBalance: matchedOutputToken?.balance,
        pricePerShareState: vault.state?.pricePerShareState,
    });

    const depositedSharesAmount = matchedOutputToken?.balance ?? '0';

    const flowKey = getStablecoinYieldFlowKey({
        accountKey: account.key,
        tokenContract: resolvedContractAddress,
        yieldId: vault.id,
    });

    const apy = vault.rewardRate.total != null ? getApyPercent(vault.rewardRate.total) : null;

    const baseCurrency = useSelector(selectBaseCurrency);
    // The deposited token (e.g. WETH) is often not held by the user, so the balance-driven fiat
    // rate fetch skips it. Force-fetch the token's rate so the approximate fiat value can render.
    useMissingRateTickersQuery({
        baseCurrencyCode: baseCurrency,
        missingRateTickers: token?.contractAddress
            ? [{ symbol: token.networkSymbol, tokenAddress: toTokenAddress(token.contractAddress) }]
            : [],
    });

    return {
        account,
        token,
        receiptToken,
        apy,
        depositedAmount,
        depositedSharesAmount,
        flowKey,
    };
};
