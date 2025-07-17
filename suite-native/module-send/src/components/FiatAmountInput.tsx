import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { getNetwork } from '@suite-common/wallet-config';
import {
    DeviceRootState,
    TransactionsRootState,
    selectAreSatsAmountUnit,
    selectLocalCurrency,
} from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Input } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useField, useFormContext } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { selectAccountTokenDecimals } from '@suite-native/tokens';
import { useNativeStyles } from '@trezor/styles';
import { BigNumber } from '@trezor/utils';

import { SendAmountCurrencyLabelWrapper, sendAmountInputWrapperStyle } from './CryptoAmountInput';
import { SendOutputsFormValues } from '../sendOutputsFormSchema';
import { SendAmountInputProps } from '../types';
import { getOutputFieldName } from '../utils';

export const FiatAmountInput = ({
    recipientIndex,
    scaleValue,
    translateValue,
    inputRef,
    symbol,
    tokenContract,
    onPress,
    onFocus,
    isDisabled = false,
    accountKey,
}: SendAmountInputProps) => {
    const { applyStyle } = useNativeStyles();
    const { setValue } = useFormContext<SendOutputsFormValues>();
    const baseCurrencyCode = useSelector(selectLocalCurrency);
    const isBtcAmountInSats = useSelector(selectAreSatsAmountUnit);
    const { fiatAmountTransformer } = useAmountInputTransformers(symbol);
    const { decimals } = getNetwork(symbol);
    const tokenDecimals = useSelector(
        (state: DeviceRootState & TokenDefinitionsRootState & TransactionsRootState) =>
            selectAccountTokenDecimals(state, accountKey, tokenContract),
    );
    const converters = useCryptoFiatConverters({ symbol, tokenContract });

    const cryptoFieldName = getOutputFieldName(recipientIndex, 'amount');
    const fiatFieldName = getOutputFieldName(recipientIndex, 'fiat');

    const fiatAnimatedStyle = useAnimatedStyle(
        () => ({
            transform: [{ scale: scaleValue.value }, { translateY: translateValue.value }],
            zIndex: isDisabled ? 0 : 1,
        }),
        [isDisabled],
    );

    const { onChange, onBlur, value } = useField({
        name: fiatFieldName,
        valueTransformer: fiatAmountTransformer,
    });

    // Validation is assigned to the crypto field, so we need to check if that field has an error.
    const { hasError } = useField({
        name: cryptoFieldName,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = fiatAmountTransformer(newValue);
        onChange(transformedValue);

        const cryptoValue = converters?.convertFiatToCrypto?.(
            asBaseCurrencyAmount(new BigNumber(transformedValue)),
        );
        if (cryptoValue) {
            const cryptoDecimals = tokenDecimals ?? decimals;
            setValue(cryptoFieldName, cryptoValue.toFixed(cryptoDecimals), {
                shouldValidate: true,
            });
        }

        setValue('setMaxOutputId', undefined);
        onFocus?.();
    };

    return (
        <Animated.View
            style={[applyStyle(sendAmountInputWrapperStyle, { isDisabled }), fiatAnimatedStyle]}
        >
            <Pressable onPress={onPress} /* onPress doesn't work on Android for disabled Input */>
                <Input
                    ref={inputRef}
                    value={value}
                    placeholder="0"
                    keyboardType="numeric"
                    accessibilityLabel="amount to send input"
                    testID={fiatFieldName}
                    editable={!isDisabled}
                    onChangeText={handleChangeValue}
                    onBlur={onBlur}
                    onPress={onPress}
                    onFocus={onFocus}
                    hasError={!isDisabled && hasError}
                    rightIcon={
                        <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                            {baseCurrencyCode === 'btc' && isBtcAmountInSats
                                ? 'sat'
                                : baseCurrencyCode.toUpperCase()}
                        </SendAmountCurrencyLabelWrapper>
                    }
                />
            </Pressable>
        </Animated.View>
    );
};
