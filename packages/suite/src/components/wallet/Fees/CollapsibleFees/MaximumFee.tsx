import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { Column, Text } from '@trezor/components';
import { TypographyStyle } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';

import { InlineLoader } from './InlineLoader';
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
            <InlineLoader
                loading={areFeesLoading}
                data-testid="@trading/quote/maximum-fee-amount-loading"
            >
                <Text variant="tertiary" typographyStyle={typographyStyle}>
                    <Translation id="TO_BE_CALCULATED" />
                </Text>
            </InlineLoader>
        );
    }

    return (
        <InlineLoader
            loading={areFeesLoading}
            data-testid="@trading/quote/maximum-fee-amount-loading"
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
        </InlineLoader>
    );
}
