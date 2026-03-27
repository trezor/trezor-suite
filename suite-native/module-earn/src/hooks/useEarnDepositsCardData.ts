import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import {
    type EarnDepositsCardActiveItem,
    type EarnDepositsCardRow,
    type StablecoinYieldEarnItem,
    type StakingEarnItem,
} from '../types';

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

    const [firstItem] = activeItems;

    return {
        type: firstItem.type,
        title,
        activeItems,
    };
};

type UseEarnDepositsCardDataProps = {
    stakingActiveItems: StakingEarnItem[];
    stablecoinYieldActiveItems: StablecoinYieldEarnItem[];
};

export const useEarnDepositsCardData = ({
    stakingActiveItems,
    stablecoinYieldActiveItems,
}: UseEarnDepositsCardDataProps) => {
    const { translate } = useTranslate();

    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const fiatCurrency = useSelector(selectBaseCurrency);

    const stakingRows = useMemo(
        () =>
            stakingActiveItems.flatMap(item => {
                if (item.accountKey === null || item.balance === null || item.balance === '0') {
                    return [];
                }

                const fiatRateKey = getFiatRateKey(item.symbol, fiatCurrency);
                const fiatRate = currentFiatRates?.[fiatRateKey]?.rate;
                const fiatAmount = asBaseCurrencyAmount(
                    new BigNumber(toFiatCurrency({ amount: item.balance, rate: fiatRate }) ?? '0'),
                );

                return [
                    {
                        id: item.id,
                        type: 'staking',
                        title: item.accountLabel ?? getNetworkDisplaySymbolName(item.symbol),
                        symbol: item.symbol,
                        accountKey: item.accountKey,
                        balance: item.balance,
                        fiatAmount,
                        apy: null,
                    } satisfies EarnDepositsCardActiveItem,
                ];
            }),
        [currentFiatRates, fiatCurrency, stakingActiveItems],
    );

    const stablecoinRows = useMemo(
        () =>
            stablecoinYieldActiveItems.flatMap(item => {
                if (
                    item.accountKey === null ||
                    item.tokenBalance === null ||
                    item.tokenBalance === '0'
                ) {
                    return [];
                }

                const fiatRateKey = getFiatRateKey(
                    item.networkSymbol,
                    fiatCurrency,
                    item.contractAddress,
                );

                const fiatRate = currentFiatRates?.[fiatRateKey]?.rate;
                const fiatAmount = asBaseCurrencyAmount(
                    new BigNumber(
                        toFiatCurrency({ amount: item.tokenBalance, rate: fiatRate }) ?? '0',
                    ),
                );

                return [
                    {
                        id: item.id,
                        type: 'stablecoin-yield',
                        title: item.vaultName,
                        networkSymbol: item.networkSymbol,
                        tokenSymbol: item.tokenSymbol,
                        contractAddress: item.contractAddress,
                        accountKey: item.accountKey,
                        accountLabel: item.accountLabel,
                        balance: item.tokenBalance,
                        fiatAmount,
                        apy: item.apy,
                    } satisfies EarnDepositsCardActiveItem,
                ];
            }),
        [currentFiatRates, fiatCurrency, stablecoinYieldActiveItems],
    );

    const totalDepositedFiatAmount = useMemo(
        () =>
            asBaseCurrencyAmount(
                [...stakingRows, ...stablecoinRows].reduce(
                    (sum, item) => sum.plus(item.fiatAmount),
                    new BigNumber(0),
                ),
            ),
        [stakingRows, stablecoinRows],
    );

    const stakingTitle = useMemo(() => {
        const firstStakingSymbol = stakingRows[0]?.symbol;
        const hasMultipleStakingSymbols = stakingRows.some(
            item => item.symbol !== firstStakingSymbol,
        );

        return firstStakingSymbol && !hasMultipleStakingSymbols
            ? translate('earn.earnScreen.depositsCard.networkStaking', {
                  networkName: getNetworkDisplaySymbolName(firstStakingSymbol),
              })
            : translate('earn.staking');
    }, [stakingRows, translate]);

    const stablecoinTitle = useMemo(() => {
        const firstStablecoinVaultName = stablecoinRows[0]?.title;
        const hasMultipleStablecoinVaults = stablecoinRows.some(
            item => item.title !== firstStablecoinVaultName,
        );

        return firstStablecoinVaultName && !hasMultipleStablecoinVaults
            ? firstStablecoinVaultName
            : translate('earn.stablecoinYield');
    }, [stablecoinRows, translate]);

    const stakingRow = useMemo(
        () =>
            createSummaryRow({
                activeItems: stakingRows,
                title: stakingTitle,
            }),
        [stakingRows, stakingTitle],
    );

    const stablecoinYieldRow = useMemo(
        () =>
            createSummaryRow({
                activeItems: stablecoinRows,
                title: stablecoinTitle,
            }),
        [stablecoinRows, stablecoinTitle],
    );

    return {
        stakingRow,
        stablecoinYieldRow,
        totalDepositedFiatAmount,
        shouldShowCard: stakingRow !== null || stablecoinYieldRow !== null,
    };
};
