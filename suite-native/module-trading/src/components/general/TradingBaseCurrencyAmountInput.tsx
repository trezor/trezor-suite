import { useSelector } from 'react-redux';

import {
    AMOUNT_MAX_LENGTH,
    selectBaseCurrency,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { getFormattedCurrencySymbol } from '@suite-native/formatters';
import { decimalTransformer } from '@suite-native/helpers';
import { selectLocale, useTranslate } from '@suite-native/intl';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';

import { AmountInput } from './Input/AmountInput';

type GetBaseCurrencyLabelParams = {
    baseCurrency: string;
    locale: string;
    isBaseCurrencyInSats: boolean;
};

const getBaseCurrencyLabel = ({
    baseCurrency,
    locale,
    isBaseCurrencyInSats,
}: GetBaseCurrencyLabelParams) => {
    if (isBaseCurrencyInSats || isFiatBaseCurrencyCode(baseCurrency)) {
        return getFormattedCurrencySymbol({
            locale,
            currency: baseCurrency,
            isSatsValue: isBaseCurrencyInSats,
        });
    }

    return baseCurrency.toUpperCase();
};

const getBaseCurrencyPlaceholder = (baseCurrencyDecimals: number) =>
    baseCurrencyDecimals > 0 ? '0.0' : '0';

export type TradingBaseCurrencyAmountInputProps = {
    value?: string;
    onChangeText: (value?: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    hasError?: boolean;
    isEditable?: boolean;
    isLoading?: boolean;
    testID?: string;
};

export const TradingBaseCurrencyAmountInput = ({
    value,
    onChangeText,
    onFocus,
    onBlur,
    hasError = false,
    isEditable = true,
    isLoading = false,
    testID,
}: TradingBaseCurrencyAmountInputProps) => {
    const locale = useSelector(selectLocale);
    const baseCurrency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    const { translate } = useTranslate();

    const baseCurrencyLabel = getBaseCurrencyLabel({ baseCurrency, locale, isBaseCurrencyInSats });
    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrency,
        isInSats: isBaseCurrencyInSats,
    });

    return (
        <AmountInput
            prefix={baseCurrencyLabel}
            size="small"
            value={value ?? ''}
            placeholder={getBaseCurrencyPlaceholder(baseCurrencyDecimals)}
            hasError={hasError}
            editable={isEditable}
            inputTransformer={decimalTransformer}
            maxDecimals={baseCurrencyDecimals}
            maxLength={AMOUNT_MAX_LENGTH}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            accessibilityLabel={translate('moduleTrading.tradingScreen.baseCurrencyAmountLabel')}
            isLoading={isLoading}
            loadingAccessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
            testID={testID}
        />
    );
};
