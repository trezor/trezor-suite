import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import RNPickerSelect, { PickerProps } from 'react-native-picker-select';
import Icon from '../Icon';
import colors from '../../config/colors';

interface Props extends PickerProps {
    onChange: () => void;
}

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: colors.INPUT_BORDER,
        borderRadius: 4,
        color: 'black',
        paddingRight: 30, // to ensure the text is never behind the icon
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colors.INPUT_BORDER,
        borderRadius: 4,
        color: 'black',
        paddingRight: 30, // to ensure the text is never behind the icon
    },
});

const Select = ({ onChange, ...rest }: Props) => (
    <RNPickerSelect
        onValueChange={onChange}
        Icon={() => {
            return <Icon icon="ARROW_DOWN" />;
        }}
        style={{
            iconContainer: {
                top: 18,
                right: 15,
            },
        }}
        textInputProps={{
            style:
                Platform.OS === 'ios'
                    ? pickerSelectStyles.inputIOS
                    : pickerSelectStyles.inputAndroid,
        }}
        useNativeAndroidPickerStyle={false}
        {...rest}
    />
);

export { Select };
