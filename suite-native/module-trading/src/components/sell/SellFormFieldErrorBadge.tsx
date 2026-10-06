import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { selectTradingSellIsLoading } from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Badge } from '@suite-native/atoms';
import { useField, useWatch } from '@suite-native/forms';
import { truncateDecimals } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '@suite-native/trading-consts';
import { type SellFormValues } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { useConvertFormValueToBaseUnit } from '../../hooks/general/useConvertFormValueToBaseUnit';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';

export type SellFormFieldErrorBadgeProps = {
    fieldName: keyof SellFormValues;
};

const asNonEmptyStringValue = (value: unknown): string => (value as string) ?? '0';

const useMismatchedAmountMessage = (fieldName: keyof SellFormValues) => {
    const { control } = useSellFormContext();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter, BaseCurrencyAmountFormatter } = useFormatters();
    const { convertStrToBaseUnit } = useConvertFormValueToBaseUnit();

    const [asset, quote, amountInCrypto, value] = useWatch({
        control,
        name: ['sendAsset', 'quote', 'amountInCrypto', fieldName],
    });
    const symbol = getSymbolFromTradeableAsset(asset);

    if (!quote) {
        return undefined;
    }

    const { fiatStringAmount, cryptoStringAmount, fiatCurrency } = quote;
    let requestedAmount: string | null = null;
    let quoteAmount: string | null = null;

    if (amountInCrypto && fieldName === 'cryptoStringAmount' && cryptoStringAmount && symbol) {
        const nonEmptyValue = asNonEmptyStringValue(value);
        const convertedRequestedAmount = convertStrToBaseUnit(nonEmptyValue, symbol) as string;
        requestedAmount = CryptoAmountFormatter.format(convertedRequestedAmount, {
            symbol,
            isBalance: true,
        });

        const truncatedCryptoAmount = truncateDecimals(cryptoStringAmount, MAX_CRYPTO_DECIMALS);
        quoteAmount = CryptoAmountFormatter.format(truncatedCryptoAmount, {
            symbol,
            isBalance: true,
        });
    } else if (
        !amountInCrypto &&
        fieldName === 'fiatStringAmount' &&
        fiatStringAmount &&
        fiatCurrency
    ) {
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
        return <Badge label={errorMessage} intent="critical" size="small" />;
    }

    if (mismatchedAmountMessage) {
        return <Badge label={mismatchedAmountMessage} intent="neutral" size="small" />;
    }

    return null;
};
