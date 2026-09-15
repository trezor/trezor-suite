import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type FeesRootState, selectAreFeesLoading } from '@suite-common/wallet-core';
import { Column, LoadingContent, Skeleton, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

import { useFeesContext } from '../context/FeesContext';
import { type TransactionMaxFee } from './hooks/useTransactionMaxFee';

export type MaximumFeeProps = {
    typographyStyle: TypographyStyle;
    txMaxFee: TransactionMaxFee;
};

export function MaximumFee({ typographyStyle, txMaxFee }: MaximumFeeProps) {
    const { networkSymbol, isComposing } = useFeesContext();
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, networkSymbol),
    );

    const renderAmount = () => {
        if (isComposing) {
            return (
                <Column alignItems="flex-end">
                    <Skeleton height={16} animate />
                    <Skeleton height={12} animate />
                </Column>
            );
        }

        if (!txMaxFee) {
            return (
                <Text
                    intent="neutral"
                    priority="secondary"
                    typographyStyle={typographyStyle}
                    data-testid="@trading/quote/maximum-fee-amount-to-be-calculated"
                >
                    <Translation id="TO_BE_CALCULATED" />
                </Text>
            );
        }

        return (
            <Column alignItems="flex-end">
                <Text intent="neutral" typographyStyle={typographyStyle}>
                    <FormattedCryptoAmount
                        data-testid="@trading/quote/maximum-fee-amount"
                        disableHiddenPlaceholder
                        value={txMaxFee}
                        symbol={networkSymbol}
                    />
                </Text>

                <Text
                    data-testid="@trading/quote/maximum-fee-fiat-amount"
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-sm"
                >
                    <BaseCurrencyValue
                        disableHiddenPlaceholder
                        amount={txMaxFee}
                        symbol={networkSymbol}
                        showApproximationIndicator
                    />
                </Text>
            </Column>
        );
    };

    return (
        <LoadingContent size={20} isLoading={areFeesLoading} slideContent={false}>
            {renderAmount()}
        </LoadingContent>
    );
}
