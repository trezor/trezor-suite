import { forwardRef, useEffect, useState } from 'react';

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

export const EthereumFeeCards = forwardRef<HTMLDivElement, StandardFeeProps>(
    (
        {
            feeOptions,
            selectedLevel,
            changeFeeLevel,
            symbol,
            networkType,
            columns,
            isDirty,
            transactionInfo,
        },
        ref,
    ) => {
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
            if (fee.maxWaitTimeEstimate) {
                return `~${formatDurationStrict(fee.maxWaitTimeEstimate / 1000, locale)}`;
            }

            return undefined;
        };

        return (
            <>
                <FeeCardsWrapper
                    $columns={columns ?? 1}
                    ref={ref}
                    data-testid="@wallet/fee-details"
                >
                    {feeOptions.map(fee => (
                        <FeeCard
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
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={fee.networkAmount || ''}
                                    symbol={symbol}
                                    showApproximationIndicator
                                />
                            }
                            bottomRightChild={
                                <FeeRate
                                    feeRate={isEip1559(fee) ? fee.maxFeePerGas : fee.feePerUnit}
                                    networkType={networkType}
                                    symbol={symbol}
                                />
                            }
                            tooltipContent={
                                isDebug && isEip1559(fee) ? (
                                    <Grid columns={2} gap={spacings.xs}>
                                        <Row>
                                            <Badge variant="warning" size="small">
                                                <Translation id="TR_DEBUG_ONLY" />
                                            </Badge>
                                        </Row>
                                        <span />
                                        <Translation id="TR_MAX_FEE_PER_GAS" />
                                        <span>
                                            {fee.maxFeePerGas} {getFeeUnits(networkType)}
                                        </span>
                                        <Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />
                                        <span>
                                            {fee.maxPriorityFeePerGas} {getFeeUnits(networkType)}
                                        </span>
                                        <Translation id="TR_BASE_FEE" />
                                        <span>
                                            {fee.baseFeePerGas} {getFeeUnits(networkType)}
                                        </span>
                                    </Grid>
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
    },
);
