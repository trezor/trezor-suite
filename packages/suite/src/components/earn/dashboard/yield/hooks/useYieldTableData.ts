import { useMemo } from 'react';

import { type TokenDto, type YieldDto } from '@suite-common/earn-stablecoin-api';
import {
    NORMAL_ACCOUNT_TYPE,
    type NetworkSymbol,
    getNetworkByYieldXyzId,
} from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { type Account, type TokenInfoBranded, toTokenSymbol } from '@suite-common/wallet-types';
import { getApyPercent, getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import {
    compareYieldRowsByAvailableBalanceDesc,
    compareYieldRowsBySuppliedAmountDesc,
} from '../../utils/earnYieldUtils';
import {
    type YieldAccountOpportunity,
    type YieldInactiveVaultOpportunity,
    type YieldOpportunityData,
} from '../types';

const getNormalizedTokenAddress = ({
    networkSymbol,
    tokenAddress,
}: {
    networkSymbol: NetworkSymbol;
    tokenAddress?: string;
}) => {
    if (!tokenAddress) {
        return undefined;
    }

    return getContractAddressForNetworkSymbol(networkSymbol, tokenAddress);
};

const doTokensMatch = ({
    networkSymbol,
    firstToken,
    secondToken,
}: {
    networkSymbol: NetworkSymbol;
    firstToken?: Pick<TokenDto, 'address' | 'symbol' | 'decimals'>;
    secondToken?: Pick<TokenDto, 'address' | 'symbol' | 'decimals'>;
}) => {
    if (!firstToken || !secondToken) {
        return false;
    }

    const firstTokenAddress = getNormalizedTokenAddress({
        networkSymbol,
        tokenAddress: firstToken.address,
    });
    const secondTokenAddress = getNormalizedTokenAddress({
        networkSymbol,
        tokenAddress: secondToken.address,
    });

    if (firstTokenAddress && secondTokenAddress) {
        return firstTokenAddress === secondTokenAddress;
    }

    return (
        firstToken.symbol.toLowerCase() === secondToken.symbol.toLowerCase() &&
        firstToken.decimals === secondToken.decimals
    );
};

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
    token?: Pick<TokenDto, 'address' | 'symbol' | 'decimals'>;
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

const getConvertedOutputTokenBalanceToInputTokenAmount = ({
    matchedOutputToken,
    networkSymbol,
    vault,
}: {
    matchedOutputToken: TokenInfoBranded | undefined;
    networkSymbol: NetworkSymbol;
    vault: YieldDto;
}) => {
    if (!matchedOutputToken) {
        return '0';
    }

    if (
        doTokensMatch({
            networkSymbol,
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
            networkSymbol,
            firstToken: pricePerShareState.shareToken,
            secondToken: vault.outputToken,
        }) ||
        !doTokensMatch({
            networkSymbol,
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

const getYieldOpportunityData = ({
    account,
    networkSymbol,
    vault,
}: {
    account: Account;
    networkSymbol: NetworkSymbol;
    vault: YieldDto;
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
    const suppliedAmount = getConvertedOutputTokenBalanceToInputTokenAmount({
        matchedOutputToken,
        networkSymbol,
        vault,
    });
    const additionalSupplyAmount = matchedInputToken?.balance ?? '0';
    const hasRewardsData =
        new BigNumber(suppliedAmount).gt(0) || new BigNumber(additionalSupplyAmount).gt(0);

    return {
        matchedInputToken,
        hasVaultPosition,
        hasRewardsData,
        suppliedAmount,
        additionalSupplyAmount,
        suppliedSymbol: matchedInputToken?.symbol ?? toTokenSymbol(vault.token.symbol),
        suppliedContractAddress: matchedInputToken?.contract ?? vault.token.address ?? null,
    };
};

type UseYieldTableDataProps = {
    availableVaults: YieldDto[];
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
                account =>
                    account.accountType === NORMAL_ACCOUNT_TYPE &&
                    account.symbol === network.symbol,
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
        const supplyableOpportunities: YieldAccountOpportunity[] = [];
        const buyOnlyOpportunities: YieldAccountOpportunity[] = [];

        allOpportunities.forEach(opportunity => {
            const hasMatchedInputToken = opportunity.matchedInputToken !== undefined;
            const hasSupplyableBalance = new BigNumber(opportunity.additionalSupplyAmount).gt(0);

            if (opportunity.hasVaultPosition) {
                activeOpportunities.push(opportunity);

                return;
            }

            if (hasMatchedInputToken && hasSupplyableBalance) {
                supplyableOpportunities.push(opportunity);

                return;
            }

            buyOnlyOpportunities.push(opportunity);
        });

        return [
            ...activeOpportunities.toSorted(compareYieldRowsBySuppliedAmountDesc),
            ...supplyableOpportunities.toSorted(compareYieldRowsByAvailableBalanceDesc),
            ...buyOnlyOpportunities.toSorted(compareYieldRowsByAvailableBalanceDesc),
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

        return opportunities;
    }, [availableVaults, deviceSupportedNetworkSymbols, visibleAccountSymbols]);

    const isYieldActive = useMemo(
        () => yieldAccountOpportunities.some(opportunity => opportunity.hasVaultPosition),
        [yieldAccountOpportunities],
    );

    const hasAnyRewardsData = useMemo(
        () => yieldAccountOpportunities.some(opportunity => opportunity.hasRewardsData),
        [yieldAccountOpportunities],
    );

    return {
        isYieldActive,
        hasAnyRewardsData,
        yieldAccountOpportunities,
        yieldInactiveVaultOpportunities,
    };
};
