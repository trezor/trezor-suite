import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '../../consts/general/consts';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useConvertFormValueToBaseUnit } from '../../hooks/general/useConvertFormValueToBaseUnit';
import { TradingBuyFormValues } from '../../types';
import { truncateDecimals } from '../../utils/general/amountUtils';
import { getSelectedSymbolFromBuyForm } from '../../utils/general/tradeableAssetUtils';

export type BuyFormFieldErrorBadgeProps = {
    fieldName: keyof TradingBuyFormValues;
};

const asNonEmptyStringValue = (value: unknown): string => (value as string) ?? '0';

const useMismatchedAmountMessage = (fieldName: keyof TradingBuyFormValues) => {
    const form = useBuyFormContext();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter, FiatAmountFormatter } = useFormatters();
    const symbol = getSelectedSymbolFromBuyForm(form);
    const { convertStrToBaseUnit } = useConvertFormValueToBaseUnit();

    const [quote, amountInCrypto, value] = form.watch(['quote', 'amountInCrypto', fieldName]);

    if (!quote) {
        return undefined;
    }

    const { receiveStringAmount, fiatStringAmount, fiatCurrency } = quote;
    let requestedAmount: string | null = null;
    let quoteAmount: string | null = null;

    if (amountInCrypto && fieldName === 'cryptoValue' && receiveStringAmount && symbol) {
        const nonEmptyValue = asNonEmptyStringValue(value);
        const convertedRequestedAmount = convertStrToBaseUnit(nonEmptyValue, symbol) as string;
        requestedAmount = CryptoAmountFormatter.format(convertedRequestedAmount, {
            symbol,
            isBalance: true,
        });

        const truncatedCryptoAmount = truncateDecimals(receiveStringAmount, MAX_CRYPTO_DECIMALS);
        quoteAmount = CryptoAmountFormatter.format(truncatedCryptoAmount, {
            symbol,
            isBalance: true,
        });
    } else if (!amountInCrypto && fieldName === 'fiatValue' && fiatStringAmount && fiatCurrency) {
        requestedAmount = FiatAmountFormatter.format(asNonEmptyStringValue(value), {
            currency: fiatCurrency,
        });
        quoteAmount = FiatAmountFormatter.format(
            truncateDecimals(fiatStringAmount, MAX_FIAT_DECIMALS),
            {
                currency: fiatCurrency,
            },
        );
    }

    if (requestedAmount !== quoteAmount) {
        return translate('moduleTrading.tradingScreen.providerOffer', {
            amount: quoteAmount,
        });
    }

    return undefined;
};

export const BuyFormFieldErrorBadge = ({ fieldName }: BuyFormFieldErrorBadgeProps) => {
    const isLoading = useSelector(selectTradingBuyIsLoading);

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
