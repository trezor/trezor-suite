import { type Ref } from 'react';
import { type Insets, type TextInput } from 'react-native';

import { AMOUNT_MAX_LENGTH } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';
import { nativeSpacings } from '@trezor/theme';

import { AmountInput, type AmountInputProps } from './Input/AmountInput';
import { useBaseCurrencyAmountPlaceholder } from '../../hooks/general/useBaseCurrencyAmountPlaceholder';

const BASE_CURRENCY_AMOUNT_INPUT_HIT_SLOP: Insets = {
    top: nativeSpacings.sp8,
    bottom: nativeSpacings.sp8,
    left: nativeSpacings.sp20,
};

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
    const { translate } = useTranslate();
    const { baseCurrencyLabel, baseCurrencyDecimals, placeholder } =
        useBaseCurrencyAmountPlaceholder();

    return (
        <AmountInput
            hitSlop={hitSlop}
            ref={ref}
            prefix={baseCurrencyLabel}
            size="small"
            value={value ?? ''}
            placeholder={placeholder}
            hasError={hasError}
            editable={isEditable}
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
