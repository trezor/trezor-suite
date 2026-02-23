import { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '@suite-native/trading-consts';
import { BuyFormValues } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useConvertFormValueToBaseUnit } from '../../hooks/general/useConvertFormValueToBaseUnit';
import { truncateDecimals } from '../../utils/general/amountUtils';

export type BuyFormFieldErrorBadgeProps = PropsWithChildren<{
    fieldName: keyof BuyFormValues;
}>;

const asNonEmptyStringValue = (value: unknown): string => (value as string) ?? '0';

const useMismatchedAmountMessage = (fieldName: keyof BuyFormValues) => {
    const { watch } = useBuyFormContext();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter, BaseCurrencyAmountFormatter } = useFormatters();
    const { convertStrToBaseUnit } = useConvertFormValueToBaseUnit();

    const [asset, quote, amountInCrypto, value] = watch([
        'asset',
        'quote',
        'amountInCrypto',
        fieldName,
    ]);
    const symbol = getSymbolFromTradeableAsset(asset);

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

export const BuyFormFieldErrorBadge = ({ fieldName, children }: BuyFormFieldErrorBadgeProps) => {
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const { errorMessage, hasError } = useField({ name: fieldName });
    const mismatchedAmountMessage = useMismatchedAmountMessage(fieldName);

    if (!isLoading) {
        if (hasError) {
            return <Badge label={errorMessage} variant="red" size="small" />;
        }

        if (mismatchedAmountMessage) {
            return <Badge label={mismatchedAmountMessage} variant="neutral" size="small" />;
        }
    }

    return children;
};
