import React, { useState } from 'react';
import { TextInput } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Text } from '../Text';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

type InputProps = {
    value: string;
    label: string;
    onChange: (value: string) => void;
};

const inputWrapperStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.gray300,
    backgroundColor: utils.colors.gray300,
    borderRadius: utils.borders.radii.small,
    paddingVertical: utils.spacings.small,
    paddingHorizontal: 14,
    height: 58,
    justifyContent: 'center',
}));

const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography.body,
    alignItems: 'center',
    justifyContent: 'center',
    color: utils.colors.gray700,
    padding: 0,
    maxHeight: 24,
}));

export const Input = ({ value, onChange, label }: InputProps) => {
    const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

    const { applyStyle } = useNativeStyles();

    const shouldDisplayLabel = isInputFocused || Boolean(value);

    return (
        <TouchableWithoutFeedback
            style={applyStyle(inputWrapperStyle)}
            onPress={() => console.log('ahoj')}
        >
            {shouldDisplayLabel && (
                <Text variant="label" color="gray600" numberOfLines={1}>
                    {label}
                </Text>
            )}
            <TextInput
                value={value}
                onChangeText={onChange}
                style={applyStyle(inputStyle)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={isInputFocused ? '' : label}
            />
        </TouchableWithoutFeedback>
    );
};
