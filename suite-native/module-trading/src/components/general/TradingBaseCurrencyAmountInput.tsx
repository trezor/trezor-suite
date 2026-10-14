import { type Ref } from 'react';
import { type Insets, type TextInput } from 'react-native';
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
import { nativeSpacings } from '@trezor/theme';

import { AmountInput, type AmountInputProps } from './Input/AmountInput';

const BASE_CURRENCY_AMOUNT_INPUT_HIT_SLOP: Insets = {
    top: nativeSpacings.sp8,
    bottom: nativeSpacings.sp8,
    left: nativeSpacings.sp20,
};

const getBaseCurrencyPlaceholder = (baseCurrencyDecimals: number) =>
    baseCurrencyDecimals > 0 ? '0.0' : '0';

export type TradingBaseCurrencyAmountInputProps = {
    value?: string;
    onChangeText: (value?: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onPress?: () => void;
    hasError?: boolean;
    isEditable?: boolean;
    isLoading?: boolean;
    testID?: string;
    ref?: Ref<TextInput>;
    hitSlop?: AmountInputProps['hitSlop'];
};

export const TradingBaseCurrencyAmountInput = ({
    value,
    onChangeText,
    onFocus,
    onBlur,
    onPress,
    hasError = false,
    isEditable = true,
    isLoading = false,
    testID,
    ref,
    hitSlop = BASE_CURRENCY_AMOUNT_INPUT_HIT_SLOP,
}: TradingBaseCurrencyAmountInputProps) => {
    const locale = useSelector(selectLocale);
    const baseCurrency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    const { translate } = useTranslate();

    const baseCurrencyLabel = getFormattedCurrencySymbol({
        locale,
        currency: baseCurrency,
        isSatsValue: isBaseCurrencyInSats,
    });
    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrency,
        isInSats: isBaseCurrencyInSats,
    });

    return (
        <AmountInput
            hitSlop={hitSlop}
            ref={ref}
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
            onPress={onPress}
            accessibilityLabel={translate('moduleTrading.tradingScreen.baseCurrencyAmountLabel')}
            isLoading={isLoading}
            loadingAccessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
            testID={testID}
        />
    );
};
