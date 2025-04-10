import { useEffect, useState } from 'react';

import { formatDurationStrict } from '@suite-common/suite-utils';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';

import { Translation } from 'src/components/suite';
import { FiatValue } from 'src/components/suite/FiatValue';
import { useLocales } from 'src/hooks/suite';

import { FeeCard } from './FeeCard';
import { FeeCardsWrapper, StandardFeeProps } from './StandardFee';
import { DustPreventionNotice } from '../DustPreventionNotice';
import { FeeOptionType, getFeeLevelTranslationId } from '../Fees';

export const BitcoinFeeCards = ({
    networkType,
    feeInfo,
    transactionInfo,
    feeOptions,
    selectedLevel,
    changeFeeLevel,
    symbol,
    isDirty,
    getValues,
}: StandardFeeProps) => {
    const locale = useLocales();

    const [cachedBytes, setCachedBytes] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (transactionInfo && transactionInfo.type !== 'error' && transactionInfo.bytes) {
            setCachedBytes(transactionInfo.bytes);
        }
        if (!isDirty) {
            setCachedBytes(undefined);
        }
    }, [transactionInfo, isDirty]);

    if (!feeOptions.length) {
        return null;
    }

    const getTimeEstimate = (fee: FeeOptionType) => {
        if (fee.blocks) {
            return `~${formatDurationStrict(feeInfo.blockTime * fee.blocks * 60, locale)}`;
        }

        return undefined;
    };

    return (
        <>
            <FeeCardsWrapper data-testid="@wallet/fee-details">
                {feeOptions.map(fee => (
                    <FeeCard
                        key={fee.value}
                        value={fee.value}
                        isSelected={selectedLevel.label === fee.value}
                        changeFeeLevel={changeFeeLevel}
                        topLeftChild={
                            <span data-testid={`@fee-card/${fee.value}`}>
                                <Translation id={getFeeLevelTranslationId(fee.value)} />
                            </span>
                        }
                        topRightChild={getTimeEstimate(fee)}
                        bottomLeftChild={
                            <span data-testid={`@fee-card/${fee.value}-fait-amount`}>
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={fee?.networkAmount ?? ''}
                                    symbol={symbol}
                                    showApproximationIndicator
                                />
                            </span>
                        }
                        bottomRightChild={
                            <span data-testid={`@fee-card/${fee.value}-rate`}>
                                <FeeRate
                                    feeRate={fee.feePerUnit}
                                    networkType={networkType}
                                    symbol={symbol}
                                />
                            </span>
                        }
                    />
                ))}
            </FeeCardsWrapper>
            <DustPreventionNotice
                chosenFeePerByte={selectedLevel.feePerUnit}
                composedFeePerByte={
                    transactionInfo?.type === 'final' ? transactionInfo.feePerByte : undefined
                }
                baseFee={getValues('baseFee')}
                feeUnits={getFeeUnits(networkType)}
            />
            {cachedBytes && (
                <Row alignItems="baseline" justifyContent="space-between">
                    <Text variant="tertiary" typographyStyle="hint">
                        <Translation id="TR_SIZE" />:
                    </Text>
                    <Text variant="default" typographyStyle="hint">
                        {cachedBytes} <Translation id="TR_BYTES" />
                    </Text>
                </Row>
            )}
        </>
    );
};
