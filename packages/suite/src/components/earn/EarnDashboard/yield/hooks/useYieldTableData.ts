import { useMemo } from 'react';

import { YieldDto } from '@suite-common/earn-api';
import {
    NORMAL_ACCOUNT_TYPE,
    type NetworkSymbol,
    getNetworkByYieldXyzId,
} from '@suite-common/wallet-config';
import { Account, TokenInfoBranded, toTokenSymbol } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { getApyPercent } from '../../../utils/earnApyUtils';
import {
    compareYieldRowsByAvailableBalanceDesc,
    compareYieldRowsBySuppliedAmountDesc,
    getYieldAddressKey,
} from '../../utils/earnYieldUtils';
import { type YieldAccountOpportunity, type YieldInactiveVaultOpportunity } from '../types';

const getMatchedTokenForVault = (
    account: Account,
    vault: YieldDto,
): TokenInfoBranded | undefined => {
    const accountTokens = account.tokens as TokenInfoBranded[] | undefined;

    if (!accountTokens?.length) {
        return undefined;
    }

    const vaultTokenAddress = vault.token.address?.toLowerCase();
    const vaultTokenSymbol = vault.token.symbol.toLowerCase();

    return accountTokens.find(token => {
        const tokenAddress = token.contract?.toLowerCase();

        if (vaultTokenAddress && tokenAddress) {
            return tokenAddress === vaultTokenAddress;
        }

        return token.symbol.toLowerCase() === vaultTokenSymbol;
    });
};

type UseYieldTableDataProps = {
    availableVaults: YieldDto[];
    deviceSupportedNetworkSymbols: NetworkSymbol[];
    suppliedBalancesByYieldAndAddress: Map<string, string>;
    visibleAccounts: Account[];
    visibleAccountSymbols: Set<NetworkSymbol>;
};

export const useYieldTableData = ({
    availableVaults,
    deviceSupportedNetworkSymbols,
    suppliedBalancesByYieldAndAddress,
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

            return networkAccounts.map(account => {
                const matchedToken = getMatchedTokenForVault(account, vault);
                const suppliedAmount =
                    suppliedBalancesByYieldAndAddress.get(
                        getYieldAddressKey(vault.id, account.descriptor),
                    ) ?? '0';

                return {
                    key: `${vault.id}:${account.key}`,
                    account,
                    networkSymbol: network.symbol,
                    vault,
                    matchedToken,
                    suppliedAmount,
                    additionalSupplyAmount: matchedToken?.balance ?? '0',
                    suppliedSymbol: matchedToken?.symbol ?? toTokenSymbol(vault.token.symbol),
                    suppliedContractAddress: matchedToken?.contract ?? vault.token.address ?? null,
                    apyPercentage: getApyPercent(vault.rewardRate.total),
                };
            });
        });

        const activeOpportunities: YieldAccountOpportunity[] = [];
        const supplyableOpportunities: YieldAccountOpportunity[] = [];
        const buyOnlyOpportunities: YieldAccountOpportunity[] = [];

        allOpportunities.forEach(opportunity => {
            const hasSuppliedBalance = new BigNumber(opportunity.suppliedAmount).gt(0);
            const hasMatchedToken = opportunity.matchedToken !== undefined;
            const hasSupplyableBalance = new BigNumber(opportunity.additionalSupplyAmount).gt(0);

            if (hasSuppliedBalance) {
                activeOpportunities.push(opportunity);

                return;
            }

            if (hasMatchedToken && hasSupplyableBalance) {
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
    }, [
        availableVaults,
        suppliedBalancesByYieldAndAddress,
        visibleAccounts,
        visibleAccountSymbols,
    ]);

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
        () =>
            yieldAccountOpportunities.some(opportunity =>
                new BigNumber(opportunity.suppliedAmount).gt(0),
            ),
        [yieldAccountOpportunities],
    );

    return {
        isYieldActive,
        yieldAccountOpportunities,
        yieldInactiveVaultOpportunities,
    };
};
