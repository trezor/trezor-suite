import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { selectTradingSellIsLoading } from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { MAX_FIAT_DECIMALS } from '../../consts/general/consts';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { SellFormValues } from '../../types/sell';
import { truncateDecimals } from '../../utils/general/amountUtils';

export type SellFormFieldErrorBadgeProps = {
    fieldName: keyof SellFormValues;
};

const asNonEmptyStringValue = (value: unknown): string => (value as string) ?? '0';

const useMismatchedAmountMessage = (fieldName: keyof SellFormValues) => {
    const { watch } = useSellFormContext();
    const { translate } = useTranslate();
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const [quote, amountInCrypto, value] = watch(['quote', 'amountInCrypto', fieldName]);

    if (!quote) {
        return undefined;
    }

    const { fiatStringAmount, fiatCurrency } = quote;
    let requestedAmount: string | null = null;
    let quoteAmount: string | null = null;

    if (!amountInCrypto && fieldName === 'fiatStringAmount' && fiatStringAmount && fiatCurrency) {
        requestedAmount = BaseCurrencyAmountFormatter.format(
            asBaseCurrencyAmount(new BigNumber(asNonEmptyStringValue(value))),
            { currency: fiatCurrency },
        );
        quoteAmount = BaseCurrencyAmountFormatter.format(
            asBaseCurrencyAmount(
                new BigNumber(truncateDecimals(fiatStringAmount, MAX_FIAT_DECIMALS)),
            ),
            { currency: fiatCurrency },
        );
    }

    if (requestedAmount !== quoteAmount) {
        return translate('moduleTrading.tradingScreen.providerOffer', {
            amount: quoteAmount,
        });
    }

    return undefined;
};

export const SellFormFieldErrorBadge = ({ fieldName }: SellFormFieldErrorBadgeProps) => {
    const isLoading = useSelector(selectTradingSellIsLoading);

    const { errorMessage, hasError } = useField({ name: fieldName });
    const mismatchedAmountMessage = useMismatchedAmountMessage(fieldName);

    if (isLoading) {
        return null;
    }

    if (hasError) {
        return <Badge label={errorMessage} variant="red" size="small" />;
    }

    if (mismatchedAmountMessage) {
        return <Badge label={mismatchedAmountMessage} variant="neutral" size="small" />;
    }

    return null;
};
