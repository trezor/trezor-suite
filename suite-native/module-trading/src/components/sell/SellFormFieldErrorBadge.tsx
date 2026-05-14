import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { invariant } from '@suite-common/suite-utils';
import { selectTradingSellIsLoading } from '@suite-common/trading';
import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '@suite-native/trading-consts';
import { type TradingRootState, selectAmountInBaseFiatCurrency } from '@suite-native/trading-state';
import { type SellFormValues, type TradeableAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { useConvertFormValueToBaseUnit } from '../../hooks/general/useConvertFormValueToBaseUnit';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { truncateDecimals } from '../../utils/general/amountUtils';
import { FiatAmountBadge } from '../general/FiatAmountBadge';

export type SellFormFieldErrorBadgeProps = {
    fieldName: keyof SellFormValues;
};

type SellSendFiatAmountBadgeProps = {
    amount: string;
    asset: TradeableAsset;
};

const asNonEmptyStringValue = (value: unknown): string => (value as string) ?? '0';

const useMismatchedAmountMessage = (fieldName: keyof SellFormValues) => {
    const { watch } = useSellFormContext();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter, BaseCurrencyAmountFormatter } = useFormatters();
    const { convertStrToBaseUnit } = useConvertFormValueToBaseUnit();

    const [asset, quote, amountInCrypto, value] = watch([
        'sendAsset',
        'quote',
        'amountInCrypto',
        fieldName,
    ]);
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

const SellSendFiatAmountBadge = ({ amount, asset }: SellSendFiatAmountBadgeProps) => {
    const { convertStrToBaseUnit } = useConvertFormValueToBaseUnit();
    const symbol = getSymbolFromTradeableAsset(asset);
    invariant(symbol, 'Asset symbol is undefined');

    const convertedAmount = convertStrToBaseUnit(amount, symbol);
    invariant(convertedAmount, 'Amount could not be converted to base unit');

    const fiatAmount = useSelector(
        (state: FiatRatesRootState & WalletSettingsRootState & TradingRootState) =>
            selectAmountInBaseFiatCurrency(state, asset, convertedAmount),
    );

    return <FiatAmountBadge amount={fiatAmount} />;
};

export const SellFormFieldErrorBadge = ({ fieldName }: SellFormFieldErrorBadgeProps) => {
    const isLoading = useSelector(selectTradingSellIsLoading);
    const { watch } = useSellFormContext();

    const { errorMessage, hasError, value } = useField({ name: fieldName });
    const mismatchedAmountMessage = useMismatchedAmountMessage(fieldName);

    if (!isLoading) {
        if (hasError) {
            return <Badge label={errorMessage} intent="critical" size="small" />;
        }

        if (mismatchedAmountMessage) {
            return <Badge label={mismatchedAmountMessage} intent="neutral" size="small" />;
        }
    }

    if (fieldName === 'cryptoStringAmount') {
        const asset = watch('sendAsset');
        if (!asset || !value) {
            return null;
        }

        return <SellSendFiatAmountBadge amount={value} asset={asset} />;
    }

    return null;
};
