import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { Column, LoadingContent, Text } from '@trezor/components';
import { TypographyStyle } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';

import { useFeesContext } from '../context/FeesContext';
import { TransactionMaxFee } from './hooks/useTransactionMaxFee';

export type MaximumFeeProps = {
    typographyStyle: TypographyStyle;
    txMaxFee: TransactionMaxFee;
};

export function MaximumFee({ typographyStyle, txMaxFee }: MaximumFeeProps) {
    const { networkSymbol } = useFeesContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));

    if (!txMaxFee) {
        return (
            <LoadingContent
                size={20}
                isLoading={areFeesLoading}
                data-testid="@trading/quote/maximum-fee-amount-loading"
                slideContent={false}
            >
                <Text variant="tertiary" typographyStyle={typographyStyle}>
                    <Translation id="TO_BE_CALCULATED" />
                </Text>
            </LoadingContent>
        );
    }

    return (
        <LoadingContent
            size={20}
            isLoading={areFeesLoading}
            data-testid="@trading/quote/maximum-fee-amount-loading"
            slideContent={false}
        >
            <Column alignItems="flex-end">
                <Text variant="default" typographyStyle={typographyStyle}>
                    <FormattedCryptoAmount
                        data-testid="@trading/quote/maximum-fee-amount"
                        disableHiddenPlaceholder
                        value={txMaxFee}
                        symbol={networkSymbol}
                    />
                </Text>

                <Text
                    data-testid="@trading/quote/maximum-fee-fiat-amount"
                    variant="tertiary"
                    typographyStyle="hint"
                >
                    <BaseCurrencyValue
                        disableHiddenPlaceholder
                        amount={txMaxFee}
                        symbol={networkSymbol}
                        showApproximationIndicator
                    />
                </Text>
            </Column>
        </LoadingContent>
    );
}
