import { FeeCard, FeeCardsWrapper, feeLevelTranslationMap } from '@suite/fee';
import { Translation } from '@suite/intl';
import { type FeeOptionType, useFeesContext } from '@suite-common/fee';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { selectAreFeesLoading, useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { FeeRate } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useLocales, useSelector } from 'src/hooks/suite';

import { DustPreventionNotice } from '../../DustPreventionNotice';

type BitcoinFeeCardsProps = {
    feeOptions: FeeOptionType[];
};

export const BitcoinFeeCards = ({ feeOptions }: BitcoinFeeCardsProps) => {
    const {
        feeInfo,
        networkType,
        networkSymbol,
        changeFeeLevel,
        composedLevels,
        selectedFeeLevel,
    } = useFeesContext();
    const locale = useLocales();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(networkSymbol);
    const transactionInfo = selectedFeeLevel ? composedLevels?.[selectedFeeLevel.label] : null;

    const getTimeEstimate = (fee: FeeOptionType) => {
        if (fee.blocks) {
            return `~${formatDurationStrict(feeInfo.blockTime * fee.blocks * 60, locale)}`;
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
                        key={fee.value}
                        value={fee.value}
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
                            shallDisplayBaseCurrency && (
                                <span data-testid={`@fee-card/${fee.value}-fiat-amount`}>
                                    <BaseCurrencyValue
                                        disableHiddenPlaceholder
                                        amount={fee?.networkAmount ?? ''}
                                        symbol={networkSymbol}
                                        showApproximationIndicator
                                    />
                                </span>
                            )
                        }
                        bottomRightChild={
                            <span data-testid={`@fee-card/${fee.value}-rate`}>
                                <FeeRate feeRate={fee.feePerUnit} networkType={networkType} />
                            </span>
                        }
                    />
                ))}
            </FeeCardsWrapper>
            <DustPreventionNotice
                chosenFeePerByte={selectedFeeLevel!.feePerUnit}
                composedFeePerByte={
                    transactionInfo?.type === 'final' ? transactionInfo.feePerByte : undefined
                }
                feeUnits={getFeeUnits(networkType)}
            />
        </>
    );
};
