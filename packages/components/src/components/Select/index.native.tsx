import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Platform } from 'react-native';
import RNPickerSelect, { Item, PickerProps } from 'react-native-picker-select';
import Icon from '../Icon';
import colors from '../../config/colors';
import { Omit } from '../../support/types';

interface Props extends Omit<PickerProps, 'items' | 'placeholder'> {
    onChange: () => void;
    options: Item[];
    withDropdownIndicator?: boolean;
    isDisabled?: boolean;
    placeholder?: string;
}

const styles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: colors.INPUT_BORDER,
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colors.INPUT_BORDER,
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
    },
    disabled: {
        backgroundColor: colors.SELECT_HOVER,
    },
});

// TODO: prop `value` doesn't work
// TODO: fix conflict between `React Select` props and `React Native Select` props on import
const Select = ({
    onChange,
    withDropdownIndicator = true,
    isDisabled = false,
    placeholder,
    options,
    value,
    ...rest
}: Props) => (
    <RNPickerSelect
        onValueChange={onChange}
        Icon={() => {
            return withDropdownIndicator && !isDisabled && <Icon icon="ARROW_DOWN" />;
        }}
        style={{
            iconContainer: {
                top: 18,
                right: 15,
            },
        }}
        textInputProps={{
            style: [
                Platform.OS === 'ios' ? styles.inputIOS : styles.inputAndroid,
                isDisabled ? styles.disabled : {},
            ],
        }}
        items={options}
        placeholder={{ label: placeholder }}
        useNativeAndroidPickerStyle={false}
        disabled={isDisabled}
        value={value}
        {...rest}
    />
);

const propTypes = {
    withDropdownIndicator: PropTypes.bool,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    options: PropTypes.array,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.object,
    onChange: PropTypes.func,
};

Select.propTypes = propTypes;

export { Select };
