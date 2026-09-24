import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type FiatRatesRootState,
    createStableFiatRateKeys,
    createStableTickerId,
    createStableTickerIds,
    getEarnDepositsFiatStatus,
    getUniqueTickers,
    selectBaseCurrency,
    selectCurrentFiatRatesByFiatRateKeys,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import {
    type CryptoBaseCurrencyPair,
    type TickerId,
    asBaseCurrencyAmount,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    getContractAddressForNetworkSymbol,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type StakingListItem, type YieldListItem } from '../../types';

const isEmptyBalance = (balance: string) => new BigNumber(balance).isZero();

type UseEarnBalanceProps = {
    stakingPositions: StakingListItem[];
    yieldPositions: YieldListItem[];
};

export const useEarnBalance = ({ stakingPositions, yieldPositions }: UseEarnBalanceProps) => {
    const baseCurrency = useSelector(selectBaseCurrency);

    const fiatRateKeys = useMemo(() => {
        const positionFiatRateKeys: CryptoBaseCurrencyPair[] = [];

        for (const position of stakingPositions) {
            const { symbol } = position;
            const fiatRateKey = getFiatRateKey(symbol, baseCurrency);
            positionFiatRateKeys.push(fiatRateKey);
        }

        for (const position of yieldPositions) {
            const symbol = position.networkSymbol;
            const contractAddress = toTokenAddress(
                getContractAddressForNetworkSymbol(
                    position.networkSymbol,
                    position.tokenContractAddress,
                ),
            );
            const fiatRateKey = getFiatRateKey(symbol, baseCurrency, contractAddress);
            positionFiatRateKeys.push(fiatRateKey);
        }

        return createStableFiatRateKeys(...new Set(positionFiatRateKeys));
    }, [stakingPositions, yieldPositions, baseCurrency]);

    const currentFiatRates = useSelector((state: FiatRatesRootState) =>
        selectCurrentFiatRatesByFiatRateKeys(state, fiatRateKeys),
    );

    const {
        totalFiatAmount: totalStakingFiatAmount,
        missingRatesTickerIds: stakingMissingRatesTickerIds,
        hasFiatRate: hasStakingFiatRate,
    } = useMemo(() => {
        let hasFiatRate = false;
        let totalAmount = new BigNumber('0');
        const missingRatesTickerIds: TickerId[] = [];

        for (const position of stakingPositions) {
            const { symbol, balance } = position;

            if (isEmptyBalance(balance)) continue;

            const fiatRateKey = getFiatRateKey(symbol, baseCurrency);
            const fiatRate = currentFiatRates?.[fiatRateKey]?.rate;
            const fiatBalance = toFiatCurrency({ amount: balance, rate: fiatRate });

            if (fiatBalance === null) {
                missingRatesTickerIds.push(createStableTickerId(symbol));
            } else {
                hasFiatRate = true;
            }

            const fiatAmount = asBaseCurrencyAmount(new BigNumber(fiatBalance ?? '0'));
            totalAmount = totalAmount.plus(fiatAmount);
        }

        const totalFiatAmount = totalAmount.toString();

        return {
            hasFiatRate,
            totalFiatAmount,
            missingRatesTickerIds,
        };
    }, [stakingPositions, currentFiatRates, baseCurrency]);

    const {
        totalFiatAmount: totalYieldFiatAmount,
        missingRatesTickerIds: yieldMissingRatesTickerIds,
        hasFiatRate: hasYieldFiatRate,
    } = useMemo(() => {
        let hasFiatRate = false;
        let totalAmount = new BigNumber('0');
        const missingRatesTickerIds: TickerId[] = [];

        for (const position of yieldPositions) {
            const symbol = position.networkSymbol;
            const contractAddress = toTokenAddress(
                getContractAddressForNetworkSymbol(
                    position.networkSymbol,
                    position.tokenContractAddress,
                ),
            );
            const balance = position.tokenBalance;

            if (isEmptyBalance(balance)) continue;

            const fiatRateKey = getFiatRateKey(symbol, baseCurrency, contractAddress);
            const fiatRate = currentFiatRates?.[fiatRateKey]?.rate;
            const fiatBalance = toFiatCurrency({ amount: balance, rate: fiatRate });

            if (fiatBalance === null) {
                missingRatesTickerIds.push(createStableTickerId(symbol, contractAddress));
            } else {
                hasFiatRate = true;
            }

            const fiatAmount = asBaseCurrencyAmount(new BigNumber(fiatBalance ?? '0'));
            totalAmount = totalAmount.plus(fiatAmount);
        }

        const totalFiatAmount = totalAmount.toString();

        return {
            hasFiatRate,
            totalFiatAmount,
            missingRatesTickerIds,
        };
    }, [yieldPositions, currentFiatRates, baseCurrency]);

    const totalEarnFiatAmount = useMemo(
        () => new BigNumber(totalStakingFiatAmount).plus(totalYieldFiatAmount).toString(),
        [totalStakingFiatAmount, totalYieldFiatAmount],
    );

    const missingRateTickers = createStableTickerIds(
        ...getUniqueTickers([...stakingMissingRatesTickerIds, ...yieldMissingRatesTickerIds]),
    );

    const missingRateTickersQuery = useMissingRateTickersQuery({
        missingRateTickers,
        baseCurrencyCode: baseCurrency,
    });

    const isFiatRatesLoading = missingRateTickersQuery.isFetching;

    const { isFiatTotalIncomplete, isFiatTotalUnavailable } = getEarnDepositsFiatStatus({
        missingStakingRateTickers: stakingMissingRatesTickerIds,
        missingStablecoinYieldRateTickers: yieldMissingRatesTickerIds,
        hasStakingFiatRate,
        hasStablecoinYieldFiatRate: hasYieldFiatRate,
        isFiatRatesLoading,
    });

    return {
        totalStakingFiatAmount,
        totalYieldFiatAmount,
        totalEarnFiatAmount,
        isFiatRatesLoading,
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
        retryMissingFiatRates: missingRateTickersQuery.refetch,
    };
};
