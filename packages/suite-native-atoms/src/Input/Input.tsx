import React from 'react';
import { TextInput } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type InputProps = {
    value: string;
    onChange: (value: string) => void;
};

const inputStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
}));

export const Input = ({ value, onChange }: InputProps) => {
    const { applyStyle } = useNativeStyles();
    return <TextInput value={value} onChangeText={onChange} style={applyStyle(inputStyle)} />;
};
