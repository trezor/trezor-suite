import { useEffect, useState } from 'react';
import { useFormState } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { getFeeUnits, isEip1559 } from '@suite-common/wallet-utils';
import { Grid, Row, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite';
import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useLocales, useSelector } from 'src/hooks/suite';

import { FeeCard } from './FeeCard';
import { FeeCardsWrapper } from './StandardFee.styles';
import { feeLevelTranslationMap } from './constants';
import { type FeeOptionType } from './hooks/useNetworkFeeOptions';
import { useFeesContext } from '../../context/FeesContext';

type EthereumFeeCardsProps = {
    feeOptions: FeeOptionType[];
};

export const EthereumFeeCards = ({ feeOptions }: EthereumFeeCardsProps) => {
    const { isDirty } = useFormState<FormState>();
    const {
        feeInfo,
        networkType,
        networkSymbol: symbol,
        changeFeeLevel,
        selectedFeeLevel,
        composedLevels,
    } = useFeesContext();
    const locale = useLocales();
    const isDebug = useSelector(selectIsDebugModeActive);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, symbol));

    const [cachedGasLimit, setCachedGasLimit] = useState<string | undefined>(undefined);
    const transactionInfo = selectedFeeLevel ? composedLevels?.[selectedFeeLevel.label] : null;

    useEffect(() => {
        if (transactionInfo && transactionInfo.type !== 'error' && transactionInfo.feeLimit) {
            setCachedGasLimit(transactionInfo.feeLimit);
        } else if (!isDirty) {
            setCachedGasLimit(undefined);
        }
    }, [transactionInfo, isDirty]);

    const getTimeEstimate = (fee: FeeOptionType) => {
        if (fee.blocks && fee.blocks > 0 && feeInfo.blockTime) {
            return `~${formatDurationStrict(fee.blocks * feeInfo.blockTime, locale)}`;
        }

        return undefined;
    };

    if (!selectedFeeLevel) {
        return null;
    }

    return (
        <>
            <FeeCardsWrapper data-testid="@wallet/fee-details">
                {feeOptions.map(fee => (
                    <FeeCard
                        data-testid={`@fee-card/${fee.value}-card`}
                        value={fee.value}
                        key={fee.value}
                        isSelected={selectedFeeLevel.label === fee.value}
                        changeFeeLevel={changeFeeLevel}
                        isLoading={areFeesLoading}
                        topLeftChild={
                            <span data-testid={`@fee-card/${fee.value}`}>
                                <Translation id={feeLevelTranslationMap[fee.value]} />
                            </span>
                        }
                        topRightChild={getTimeEstimate(fee)}
                        bottomLeftChild={
                            <span data-testid={`@fee-card/${fee.value}-fiat-amount`}>
                                <BaseCurrencyValue
                                    disableHiddenPlaceholder
                                    amount={fee.networkAmount || ''}
                                    symbol={symbol}
                                    showApproximationIndicator
                                />
                            </span>
                        }
                        bottomRightChild={
                            <span data-testid={`@fee-card/${fee.value}-rate`}>
                                <FeeRate
                                    feeRate={isEip1559(fee) ? fee.maxFeePerGas : fee.feePerUnit}
                                    networkType={networkType}
                                />
                            </span>
                        }
                        tooltipContent={
                            isDebug && isEip1559(fee) ? (
                                <>
                                    <DebugOnlyBadge />
                                    <Grid
                                        columns={2}
                                        gap={spacings.xs}
                                        margin={{ top: spacings.xs }}
                                    >
                                        <Translation id="TR_MAX_FEE_PER_GAS" />
                                        <Text isMonospaced>
                                            {fee.maxFeePerGas} {getFeeUnits(networkType)}
                                        </Text>
                                        <Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />
                                        <Text isMonospaced>
                                            {fee.maxPriorityFeePerGas} {getFeeUnits(networkType)}
                                        </Text>
                                        <Translation id="TR_BASE_FEE" />
                                        <Text isMonospaced>
                                            {fee.baseFeePerGas} {getFeeUnits(networkType)}
                                        </Text>
                                    </Grid>
                                </>
                            ) : undefined
                        }
                    />
                ))}
            </FeeCardsWrapper>
            {isDebug && cachedGasLimit && (
                <Row alignItems="baseline" justifyContent="space-between">
                    <Row gap={spacings.xxs}>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            <Translation id="TR_GAS_LIMIT" />:
                        </Text>
                        <DebugOnlyBadge />
                    </Row>
                    <Text intent="neutral" typographyStyle="body-sm">
                        {cachedGasLimit}
                    </Text>
                </Row>
            )}
        </>
    );
};
