import { type TextInputProps } from 'react-native';

import { Input, Text } from '@suite-native/atoms';
import { useField, useFormContext } from '@suite-native/forms';
import { decimalTransformer } from '@suite-native/helpers';
import { useDebounce } from '@trezor/react-utils';

import { type YieldDepositFormValues } from '../yieldDepositFormSchema';

type YieldDepositAmountInputProps = {
    isDisabled?: boolean;
    onAmountChange: () => void;
    onPress?: TextInputProps['onPress'];
    tokenSymbol: string;
};

export const YieldDepositAmountInput = ({
    isDisabled = false,
    onAmountChange,
    onPress,
    tokenSymbol,
}: YieldDepositAmountInputProps) => {
    const { trigger } = useFormContext<YieldDepositFormValues>();
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
            labelType="noLabel"
            value={value}
            placeholder="0"
            keyboardType="numeric"
            accessibilityLabel="amount to deposit input"
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
