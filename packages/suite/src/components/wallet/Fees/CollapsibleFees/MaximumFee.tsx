import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { Column, LoadingContent, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

import { useFeesContext } from '../context/FeesContext';
import { type TransactionMaxFee } from './hooks/useTransactionMaxFee';

export type MaximumFeeProps = {
    typographyStyle: TypographyStyle;
    txMaxFee: TransactionMaxFee;
};

export function MaximumFee({ typographyStyle, txMaxFee }: MaximumFeeProps) {
    const { networkSymbol } = useFeesContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));

    return (
        <LoadingContent size={20} isLoading={areFeesLoading} slideContent={false}>
            {txMaxFee ? (
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
            ) : (
                <Text
                    intent="neutral"
                    priority="secondary"
                    typographyStyle={typographyStyle}
                    data-testid="@trading/quote/maximum-fee-amount-to-be-calculated"
                >
                    <Translation id="TO_BE_CALCULATED" />
                </Text>
            )}
        </LoadingContent>
    );
}
