import { type TextInputProps } from 'react-native';

import { Input, Text } from '@suite-native/atoms';
import { useField, useFormContext } from '@suite-native/forms';
import { decimalTransformer } from '@suite-native/helpers';
import { useDebounce } from '@trezor/react-utils';

import { type YieldSupplyFormValues } from '../yieldSupplyFormSchema';

type YieldSupplyAmountInputProps = {
    isDisabled?: boolean;
    onAmountChange: () => void;
    onPress?: TextInputProps['onPress'];
    tokenSymbol: string;
};

export const YieldSupplyAmountInput = ({
    isDisabled = false,
    onAmountChange,
    onPress,
    tokenSymbol,
}: YieldSupplyAmountInputProps) => {
    const { trigger } = useFormContext<YieldSupplyFormValues>();
    const debounce = useDebounce();
    const { hasError, onBlur, onChange, value } = useField({
        name: 'amount',
        valueTransformer: decimalTransformer,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = decimalTransformer(newValue);

        onChange(transformedValue);
        onAmountChange();
        debounce(() => trigger('amount'));
    };

    return (
        <Input
            value={value}
            placeholder="0"
            keyboardType="numeric"
            accessibilityLabel="amount to supply input"
            editable={!isDisabled}
            onChangeText={handleChangeValue}
            onBlur={() => {
                if (value) onBlur();
            }}
            onPress={onPress}
            hasError={!isDisabled && hasError}
            rightIcon={
                <Text color={isDisabled ? 'contentSecondary' : 'contentPrimary'}>
                    {tokenSymbol}
                </Text>
            }
        />
    );
};
