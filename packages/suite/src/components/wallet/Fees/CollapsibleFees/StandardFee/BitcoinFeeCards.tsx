import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { selectAreFeesLoading, useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { FeeRate } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useLocales } from 'src/hooks/suite';

import { FeeCard } from './FeeCard';
import { FeeCardsWrapper } from './StandardFee.styles';
import { feeLevelTranslationMap } from './constants';
import { DustPreventionNotice } from '../../DustPreventionNotice';
import { type FeeOptionType } from './hooks/useNetworkFeeOptions';
import { useFeesContext } from '../../context/FeesContext';

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
                chosenFeePerByte={selectedFeeLevel.feePerUnit}
                composedFeePerByte={
                    transactionInfo?.type === 'final' ? transactionInfo.feePerByte : undefined
                }
                feeUnits={getFeeUnits(networkType)}
            />
        </>
    );
};
