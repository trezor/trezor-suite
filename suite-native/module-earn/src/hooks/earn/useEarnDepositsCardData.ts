import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { asNetworkSymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    calculateEarnDepositsFiatData,
    getEarnDepositsFiatStatus,
    selectBaseCurrency,
    selectCurrentFiatRates,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import type {
    EarnDepositsCardActiveItem,
    EarnDepositsCardRow,
    StakingEarnItem,
    YieldEarnItem,
} from '../../types';

const createSummaryRow = ({
    activeItems,
    title,
}: {
    activeItems: EarnDepositsCardActiveItem[];
    title: string;
}): EarnDepositsCardRow | null => {
    if (activeItems.length === 0) {
        return null;
    }

    const firstItem = activeItems[0];
    if (!firstItem) {
        return null;
    }

    return {
        type: firstItem.type,
        title,
        activeItems,
    };
};

type UseEarnDepositsCardDataProps = {
    stakingActiveItems: StakingEarnItem[];
    stablecoinYieldActiveItems: YieldEarnItem[];
};

export const useEarnDepositsCardData = ({
    stakingActiveItems,
    stablecoinYieldActiveItems,
}: UseEarnDepositsCardDataProps) => {
    const { translate } = useTranslate();

    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const fiatCurrency = useSelector(selectBaseCurrency);

    const stakingDeposits = useMemo(
        () =>
            stakingActiveItems.flatMap(item => {
                if (item.accountKey === null) {
                    return [];
                }

                return [{ ...item, accountKey: item.accountKey }];
            }),
        [stakingActiveItems],
    );
    const stablecoinYieldDeposits = useMemo(
        () =>
            stablecoinYieldActiveItems.flatMap(item => {
                if (item.accountKey === null) {
                    return [];
                }

                return [
                    {
                        ...item,
                        accountKey: item.accountKey,
                        balance: item.tokenBalance,
                    },
                ];
            }),
        [stablecoinYieldActiveItems],
    );

    const {
        stakingDeposits: calculatedStakingDeposits,
        stablecoinYieldDeposits: calculatedStablecoinYieldDeposits,
        missingStakingRateTickers,
        missingStablecoinYieldRateTickers,
        missingRateTickers,
        stakingFiatAmount,
        stablecoinYieldFiatAmount,
        totalDepositedFiatAmount,
        hasStakingFiatRate,
        hasStablecoinYieldFiatRate: hasStablecoinFiatRate,
    } = useMemo(
        () =>
            calculateEarnDepositsFiatData({
                stakingDeposits,
                stablecoinYieldDeposits,
                currentFiatRates,
                baseCurrencyCode: fiatCurrency,
            }),
        [currentFiatRates, fiatCurrency, stablecoinYieldDeposits, stakingDeposits],
    );

    const stakingRows = useMemo(
        () =>
            calculatedStakingDeposits.map(
                ({ deposit, balance, fiatAmount }) =>
                    ({
                        id: deposit.id,
                        type: 'staking',
                        title:
                            deposit.accountLabel ??
                            getNetworkDisplaySymbolName(asNetworkSymbol(deposit.symbol)),
                        symbol: deposit.symbol,
                        accountKey: deposit.accountKey,
                        balance,
                        fiatAmount,
                    }) satisfies EarnDepositsCardActiveItem,
            ),
        [calculatedStakingDeposits],
    );

    const stablecoinRows = useMemo(
        () =>
            calculatedStablecoinYieldDeposits.map(
                ({ deposit, balance, fiatAmount }) =>
                    ({
                        id: deposit.id,
                        type: 'stablecoin-yield',
                        title: deposit.vaultName,
                        networkSymbol: deposit.networkSymbol,
                        tokenSymbol: deposit.tokenSymbol,
                        contractAddress: deposit.contractAddress,
                        tokenContractAddress: deposit.tokenContractAddress,
                        accountKey: deposit.accountKey,
                        accountLabel: deposit.accountLabel,
                        balance,
                        fiatAmount,
                        apy: deposit.apy,
                    }) satisfies EarnDepositsCardActiveItem,
            ),
        [calculatedStablecoinYieldDeposits],
    );

    const missingRateTickersQuery = useMissingRateTickersQuery({
        missingRateTickers,
        baseCurrencyCode: fiatCurrency,
    });
    const isFiatRatesLoading = missingRateTickersQuery.isFetching;
    const { isFiatTotalIncomplete, isFiatTotalUnavailable } = getEarnDepositsFiatStatus({
        missingStakingRateTickers,
        missingStablecoinYieldRateTickers,
        hasStakingFiatRate,
        hasStablecoinYieldFiatRate: hasStablecoinFiatRate,
        isFiatRatesLoading,
    });

    const stakingRow = useMemo(
        () =>
            createSummaryRow({
                activeItems: stakingRows,
                title: translate('earn.earnScreen.depositsCard.stakingPositions'),
            }),
        [stakingRows, translate],
    );

    const stablecoinYieldRow = useMemo(
        () =>
            createSummaryRow({
                activeItems: stablecoinRows,
                title: translate('earn.earnScreen.depositsCard.defiYieldPositions'),
            }),
        [stablecoinRows, translate],
    );

    return {
        stakingRow,
        stablecoinYieldRow,
        totalDepositedFiatAmount,
        stakingFiatAmount,
        stablecoinYieldFiatAmount,
        isFiatRatesLoading,
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
        retryMissingFiatRates: missingRateTickersQuery.refetch,
        shouldShowCard: stakingRow !== null || stablecoinYieldRow !== null,
    };
};
