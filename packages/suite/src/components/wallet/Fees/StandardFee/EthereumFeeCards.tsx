import { useEffect, useState } from 'react';

import { formatDurationStrict } from '@suite-common/suite-utils';
import { getFeeUnits, isEip1559 } from '@suite-common/wallet-utils';
import { Badge, Grid, Row, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { FiatValue, Translation } from 'src/components/suite';
import { useLocales, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

import { FeeOptionType, getFeeLevelTranslationId } from '../Fees';
import { FeeCard } from './FeeCard';
import { FeeCardsWrapper, StandardFeeProps } from './StandardFee';

export const EthereumFeeCards = ({
    feeOptions,
    selectedLevel,
    changeFeeLevel,
    symbol,
    networkType,
    isDirty,
    transactionInfo,
    feeInfo,
}: StandardFeeProps) => {
    const locale = useLocales();
    const isDebug = useSelector(selectIsDebugModeActive);
    const [cachedGasLimit, setCachedGasLimit] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (transactionInfo && transactionInfo.type !== 'error' && transactionInfo.feeLimit) {
            setCachedGasLimit(transactionInfo.feeLimit);
        }
        if (!isDirty) {
            setCachedGasLimit(undefined);
        }
    }, [transactionInfo, isDirty]);

    if (!feeOptions.length) {
        return null;
    }

    const getTimeEstimate = (fee: FeeOptionType) => {
        if (fee.blocks && fee.blocks > 0 && feeInfo.blockTime) {
            return `~${formatDurationStrict(fee.blocks * feeInfo.blockTime, locale)}`;
        }

        return undefined;
    };

    return (
        <>
            <FeeCardsWrapper data-testid="@wallet/fee-details">
                {feeOptions.map(fee => (
                    <FeeCard
                        data-testid={`@fee-card/${fee.value}-card`}
                        value={fee.value}
                        key={fee.value}
                        isSelected={selectedLevel.label === fee.value}
                        changeFeeLevel={changeFeeLevel}
                        topLeftChild={
                            <span data-testid={`@fee-card/${fee.value}`}>
                                <Translation id={getFeeLevelTranslationId(fee.value)} />
                            </span>
                        }
                        topRightChild={getTimeEstimate(fee)}
                        bottomLeftChild={
                            <span data-testid={`@fee-card/${fee.value}-fiat-amount`}>
                                <FiatValue
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
                                    symbol={symbol}
                                />
                            </span>
                        }
                        tooltipContent={
                            isDebug && isEip1559(fee) ? (
                                <>
                                    <Badge variant="warning" size="small" inline>
                                        <Translation id="TR_DEBUG_ONLY" />
                                    </Badge>
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
                        <Text variant="tertiary" typographyStyle="hint">
                            <Translation id="TR_GAS_LIMIT" />:
                        </Text>
                        <Badge variant="warning" size="small">
                            <Translation id="TR_DEBUG_ONLY" />
                        </Badge>
                    </Row>
                    <Text variant="default" typographyStyle="hint">
                        {cachedGasLimit}
                    </Text>
                </Row>
            )}
        </>
    );
};
