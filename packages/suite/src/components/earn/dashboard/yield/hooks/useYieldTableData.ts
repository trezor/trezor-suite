import { useMemo } from 'react';

import { type TokenDtoV2, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { useSelector } from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    getNetworkByYieldXyzId,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    doTokensMatch,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getYieldDepositableBalance,
    selectDeviceSupportedNetworks,
} from '@suite-common/wallet-core';
import { type Account, type TokenInfoBranded, toTokenSymbol } from '@suite-common/wallet-types';
import {
    compareEarnByAmountDesc,
    compareEarnByApyDesc,
    compareEarnByNetwork,
    compareEarnByNetworkTokenOrder,
    getApyPercent,
} from '@suite-common/wallet-utils';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import {
    type YieldAccountOpportunity,
    type YieldInactiveVaultOpportunity,
    type YieldOpportunityData,
} from '../types';

const hasTokenSymbol = (
    accountToken: NonNullable<Account['tokens']>[number],
): accountToken is TokenInfoBranded => accountToken.symbol !== undefined;

const getMatchedAccountToken = ({
    account,
    networkSymbol,
    token,
}: {
    account: Account;
    networkSymbol: NetworkSymbol;
    token?: Pick<TokenDtoV2, 'address' | 'symbol' | 'decimals'>;
}): TokenInfoBranded | undefined => {
    if (!account.tokens?.length || !token) {
        return undefined;
    }

    return account.tokens.find(
        (accountToken): accountToken is TokenInfoBranded =>
            hasTokenSymbol(accountToken) &&
            doTokensMatch({
                networkSymbol,
                firstToken: {
                    address: accountToken.contract,
                    symbol: accountToken.symbol,
                    decimals: accountToken.decimals,
                },
                secondToken: token,
            }),
    );
};

export const getYieldOpportunityData = ({
    account,
    networkSymbol,
    vault,
}: {
    account: Account;
    networkSymbol: NetworkSymbol;
    vault: YieldDtoV2;
}): YieldOpportunityData => {
    const matchedInputToken = getMatchedAccountToken({
        account,
        networkSymbol,
        token: vault.token,
    });
    const matchedOutputToken = getMatchedAccountToken({
        account,
        networkSymbol,
        token: vault.outputToken,
    });
    const hasVaultPosition = new BigNumber(matchedOutputToken?.balance ?? '0').gt(0);
    const depositedAmount = getConvertedOutputTokenBalanceToInputTokenAmount({
        networkSymbol,
        token: vault.token,
        outputToken: vault.outputToken,
        outputTokenBalance: matchedOutputToken?.balance,
        pricePerShareState: vault.state?.pricePerShareState,
    });
    // For a wrapped-native (WETH) vault the wrappable native balance counts in too, minus the
    // fee reserve kept for the follow-up wrap + approve + deposit fees.
    const additionalDepositAmount = getYieldDepositableBalance({
        networkSymbol,
        nativeFormattedBalance: account.formattedBalance,
        vaultTokenAddress: vault.token.address,
        matchedTokenBalance: matchedInputToken?.balance,
    });
    const hasRewardsData =
        new BigNumber(depositedAmount).gt(0) || new BigNumber(additionalDepositAmount).gt(0);
    // A wrapped-native vault is presented as its native asset (see #29881), so amounts are
    // denominated in the native symbol and no token contract is exposed to the formatters.
    const isWrappedNativeVault = isWrappedNativeToken(networkSymbol, vault.token.address);

    return {
        matchedInputToken,
        hasVaultPosition,
        hasRewardsData,
        depositedAmount,
        additionalDepositAmount,
        depositedSymbol: isWrappedNativeVault
            ? toTokenSymbol(getNetworkDisplaySymbol(networkSymbol))
            : (matchedInputToken?.symbol ?? toTokenSymbol(vault.token.symbol)),
        depositedContractAddress: isWrappedNativeVault
            ? null
            : (matchedInputToken?.contract ?? vault.token.address ?? null),
    };
};

const toNetworkTokenSortKey = (opportunity: YieldAccountOpportunity) =>
    opportunity.account && {
        symbol: opportunity.account.symbol,
        tokenSymbol: opportunity.depositedSymbol,
        accountType: opportunity.account.accountType,
        index: opportunity.account.index,
    };

type UseYieldTableDataProps = {
    availableVaults: YieldDtoV2[];
    visibleAccounts: Account[];
    visibleAccountSymbols: Set<NetworkSymbol>;
};

export const useYieldTableData = ({
    availableVaults,
    visibleAccounts,
    visibleAccountSymbols,
}: UseYieldTableDataProps) => {
    const yieldAccountOpportunities = useMemo<YieldAccountOpportunity[]>(() => {
        const allOpportunities = availableVaults.flatMap(vault => {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network || !visibleAccountSymbols.has(network.symbol)) {
                return [];
            }

            const networkAccounts = visibleAccounts.filter(
                account => account.symbol === network.symbol,
            );

            return networkAccounts.map(account => ({
                key: `${vault.id}:${account.key}`,
                account,
                networkSymbol: network.symbol,
                vault,
                ...getYieldOpportunityData({
                    account,
                    networkSymbol: network.symbol,
                    vault,
                }),
                apyPercentage: getApyPercent(vault.rewardRate.total),
            }));
        });

        const activeOpportunities: YieldAccountOpportunity[] = [];
        const depositableOpportunities: YieldAccountOpportunity[] = [];
        const noBalanceOpportunities: YieldAccountOpportunity[] = [];

        allOpportunities.forEach(opportunity => {
            const hasDepositableBalance = new BigNumber(opportunity.additionalDepositAmount).gt(0);

            if (opportunity.hasVaultPosition) {
                activeOpportunities.push(opportunity);

                return;
            }

            if (hasDepositableBalance) {
                depositableOpportunities.push(opportunity);

                return;
            }

            noBalanceOpportunities.push(opportunity);
        });

        return [
            ...activeOpportunities
                .toSorted(compareEarnByAmountDesc(opportunity => opportunity.depositedAmount))
                .toSorted(compareEarnByNetwork(opportunity => opportunity.account?.symbol)),
            ...depositableOpportunities
                .toSorted(
                    compareEarnByAmountDesc(opportunity => opportunity.additionalDepositAmount),
                )
                .toSorted(compareEarnByNetworkTokenOrder(toNetworkTokenSortKey)),
            ...noBalanceOpportunities.toSorted(
                compareEarnByNetworkTokenOrder(toNetworkTokenSortKey),
            ),
        ];
    }, [availableVaults, visibleAccounts, visibleAccountSymbols]);

    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const yieldInactiveVaultOpportunities = useMemo<YieldInactiveVaultOpportunity[]>(() => {
        const opportunities = availableVaults.flatMap(vault => {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network) {
                return [];
            }

            const isNetworkActivated = visibleAccountSymbols.has(network.symbol);
            const isNetworkSupported = deviceSupportedNetworkSymbols.includes(network.symbol);

            if (isNetworkActivated || !isNetworkSupported) {
                return [];
            }

            return [
                {
                    key: `${vault.id}:${network.symbol}:inactive`,
                    networkSymbol: network.symbol,
                    vault,
                    apyPercentage: getApyPercent(vault.rewardRate.total),
                },
            ];
        });

        return opportunities.toSorted(
            compareEarnByApyDesc(opportunity => opportunity.apyPercentage),
        );
    }, [availableVaults, deviceSupportedNetworkSymbols, visibleAccountSymbols]);

    const isYieldActive = useMemo(
        () => yieldAccountOpportunities.some(opportunity => opportunity.hasVaultPosition),
        [yieldAccountOpportunities],
    );

    const hasAnyRewardsData = useMemo(
        () => yieldAccountOpportunities.some(opportunity => opportunity.hasRewardsData),
        [yieldAccountOpportunities],
    );

    const yieldAccounts = useMemo(
        () => yieldAccountOpportunities.map(opportunity => opportunity.account),
        [yieldAccountOpportunities],
    );

    return {
        isYieldActive,
        hasAnyRewardsData,
        yieldAccountOpportunities,
        yieldInactiveVaultOpportunities,
        yieldAccounts,
    };
};
