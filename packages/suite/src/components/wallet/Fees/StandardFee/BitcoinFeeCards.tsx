import { formatDurationStrict } from '@suite-common/suite-utils';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { FeeRate } from '@trezor/product-components';

import { Translation } from 'src/components/suite';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useLocales, useSelector } from 'src/hooks/suite';
import { useDisplayBaseCurrency } from 'src/hooks/suite/useDisplayBaseCurrency';

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
    getValues,
}: StandardFeeProps) => {
    const locale = useLocales();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, symbol));
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

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
                        data-testid={`@fee-card/${fee.value}-card`}
                        key={fee.value}
                        value={fee.value}
                        isSelected={selectedLevel.label === fee.value}
                        changeFeeLevel={changeFeeLevel}
                        isLoading={areFeesLoading}
                        topLeftChild={
                            <span data-testid={`@fee-card/${fee.value}`}>
                                <Translation id={getFeeLevelTranslationId(fee.value)} />
                            </span>
                        }
                        topRightChild={getTimeEstimate(fee)}
                        bottomLeftChild={
                            shallDisplayBaseCurrency && (
                                <span data-testid={`@fee-card/${fee.value}-fiat-amount`}>
                                    <BaseCurrencyValue
                                        disableHiddenPlaceholder
                                        amount={fee?.networkAmount ?? ''}
                                        symbol={symbol}
                                        showApproximationIndicator
                                    />
                                </span>
                            )
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
                symbol={symbol}
                chosenFeePerByte={selectedLevel.feePerUnit}
                composedFeePerByte={
                    transactionInfo?.type === 'final' ? transactionInfo.feePerByte : undefined
                }
                baseFee={getValues('baseFee')}
                feeUnits={getFeeUnits(networkType)}
            />
        </>
    );
};
